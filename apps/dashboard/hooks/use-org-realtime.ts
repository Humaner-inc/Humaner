'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import type { OrgRealtimeEvent } from '@/lib/realtime/types';

type RealtimePayload =
  | { type: 'connected'; at: number; organizationId: string }
  | { type: 'event'; event: OrgRealtimeEvent }
  | { type: 'heartbeat'; at: number }
  | { type: 'reconnect'; at: number; since: number };

type UseOrgRealtimeOptions = {
  /** When false, skip connecting (e.g. Free plan without desk/inbox). */
  enabled?: boolean;
  onEvent?: (event: OrgRealtimeEvent) => void;
};

/**
 * Subscribes to org-scoped SSE events and refreshes RSC data on desk/inbox
 * mutations from other teammates.
 */
export function useOrgRealtime(options: UseOrgRealtimeOptions = {}): void {
  const enabled = options.enabled !== false;
  const router = useRouter();
  const onEventRef = React.useRef(options.onEvent);
  React.useEffect(() => {
    onEventRef.current = options.onEvent;
  }, [options.onEvent]);

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    let active = true;
    let since = Date.now() - 5_000;
    let abort: AbortController | null = null;
    let reconnectTimer: number | undefined;

    const connect = async (): Promise<void> => {
      if (!active) {
        return;
      }

      abort?.abort();
      abort = new AbortController();

      try {
        const response = await fetch(`/api/dashboard/realtime?since=${since}`, {
          signal: abort.signal,
          headers: { Accept: 'text/event-stream' },
          cache: 'no-store'
        });
        if (!response.ok || !response.body) {
          throw new Error(`realtime ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (active) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          for (const chunk of chunks) {
            const line = chunk
              .split('\n')
              .find((row) => row.startsWith('data: '));
            if (!line) {
              continue;
            }
            try {
              const payload = JSON.parse(line.slice(6)) as RealtimePayload;
              if (payload.type === 'event') {
                since = Math.max(since, payload.event.at);
                onEventRef.current?.(payload.event);
                if (
                  payload.event.type === 'ticket.updated' ||
                  payload.event.type === 'thread.updated' ||
                  payload.event.type === 'inbox.synced' ||
                  payload.event.type === 'agent.changed'
                ) {
                  router.refresh();
                }
              } else if (payload.type === 'reconnect') {
                since = payload.since;
              }
            } catch {
              // ignore malformed frames
            }
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }

      if (active) {
        reconnectTimer = window.setTimeout(() => {
          void connect();
        }, 2_000);
      }
    };

    void connect();

    return () => {
      active = false;
      abort?.abort();
      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, [enabled, router]);
}
