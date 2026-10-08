'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { emitOrgRealtime } from '@/lib/realtime/client-bus';
import { getHubGrant, resetHubGrant } from '@/lib/realtime/hub-client';
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
    let refreshTimer: number | undefined;
    let failures = 0;
    // Serverless fallback only; the hub stream is a cheap idle socket.
    let usingFallback = false;
    const cleanups: Array<() => void> = [];

    const scheduleRefresh = (): void => {
      if (refreshTimer !== undefined) {
        return;
      }
      refreshTimer = window.setTimeout(() => {
        refreshTimer = undefined;
        if (active) {
          router.refresh();
        }
      }, 800);
    };

    const connect = async (): Promise<void> => {
      if (!active) {
        return;
      }

      abort?.abort();
      abort = new AbortController();

      try {
        let streamUrl = `/api/dashboard/realtime?since=${since}`;
        const headers: Record<string, string> = {
          Accept: 'text/event-stream'
        };
        usingFallback = true;

        // After repeated hub failures, use the serverless route so events
        // (which fall back to Redis when the hub is down) are not missed.
        const hub = failures >= 3 ? null : await getHubGrant(abort.signal);
        if (hub) {
          streamUrl = `${hub.url}/stream?since=${since}`;
          headers.Authorization = `Bearer ${hub.token}`;
          usingFallback = false;
        } else if (document.visibilityState !== 'visible') {
          // No hub: don't hold a function open for a hidden tab.
          waitForVisible();
          return;
        }

        const response = await fetch(streamUrl, {
          signal: abort.signal,
          headers,
          cache: 'no-store'
        });
        if (response.status === 401) resetHubGrant();
        if (!response.ok || !response.body) {
          throw new Error(`realtime ${response.status}`);
        }
        failures = 0;

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
                emitOrgRealtime(payload.event);
                if (
                  payload.event.type === 'ticket.updated' ||
                  payload.event.type === 'thread.updated' ||
                  payload.event.type === 'inbox.synced' ||
                  payload.event.type === 'agent.changed'
                ) {
                  scheduleRefresh();
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
        failures += 1;
        const delay = Math.min(2_000 * 2 ** Math.min(failures - 1, 4), 30_000);
        reconnectTimer = window.setTimeout(() => {
          void connect();
        }, delay);
      }
    };

    const waitForVisible = (): void => {
      const onVisible = (): void => {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', onVisible);
        void connect();
      };
      document.addEventListener('visibilitychange', onVisible);
      cleanups.push(() =>
        document.removeEventListener('visibilitychange', onVisible)
      );
    };

    // Fallback stream ends every ~55s; pause it when the tab goes hidden.
    const onHidden = (): void => {
      if (document.visibilityState === 'hidden' && usingFallback) {
        abort?.abort();
        if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
        waitForVisible();
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    cleanups.push(() =>
      document.removeEventListener('visibilitychange', onHidden)
    );

    void connect();

    return () => {
      active = false;
      for (const cleanup of cleanups) cleanup();
      abort?.abort();
      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
      }
      if (refreshTimer !== undefined) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, [enabled, router]);
}
