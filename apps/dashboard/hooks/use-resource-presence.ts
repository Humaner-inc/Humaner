'use client';

import * as React from 'react';

import type { ResourcePresence } from '@/lib/realtime/types';

const HEARTBEAT_MS = 20_000;

type UseResourcePresenceOptions = {
  resourceType: 'ticket' | 'thread';
  resourceId: string | null | undefined;
  enabled?: boolean;
};

/**
 * Heartbeats that the current user is viewing a ticket/thread and returns
 * other active viewers (excluding self when possible via list).
 */
export function useResourcePresence(
  options: UseResourcePresenceOptions
): ResourcePresence[] {
  const enabled = options.enabled !== false && Boolean(options.resourceId);
  const [presence, setPresence] = React.useState<ResourcePresence[]>([]);

  React.useEffect(() => {
    if (!enabled || !options.resourceId) {
      setPresence([]);
      return;
    }

    let active = true;
    const resourceId = options.resourceId;
    const resourceType = options.resourceType;

    const beat = async (): Promise<void> => {
      try {
        const response = await fetch('/api/dashboard/realtime/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceType,
            resourceId,
            heartbeat: true
          }),
          cache: 'no-store'
        });
        if (!response.ok || !active) {
          return;
        }
        const data = (await response.json()) as {
          presence?: ResourcePresence[];
        };
        if (Array.isArray(data.presence)) {
          setPresence(data.presence);
        }
      } catch {
        // keep last presence
      }
    };

    void beat();
    const interval = window.setInterval(() => {
      void beat();
    }, HEARTBEAT_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [enabled, options.resourceId, options.resourceType]);

  return presence;
}
