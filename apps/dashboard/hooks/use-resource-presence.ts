'use client';

import * as React from 'react';

import { subscribeOrgRealtime } from '@/lib/realtime/client-bus';
import { getHubGrant, resetHubGrant } from '@/lib/realtime/hub-client';
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

    // Hub: heartbeats and viewer lists stay on the Railway worker (no Vercel
    // call, DB or Redis). Fallback: the serverless route.
    const beatHub = async (): Promise<boolean> => {
      const hub = await getHubGrant();
      if (!hub) return false;
      try {
        const response = await fetch(`${hub.url}/presence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hub.token}`
          },
          body: JSON.stringify({ resourceType, resourceId }),
          cache: 'no-store'
        });
        if (response.status === 401) {
          resetHubGrant();
          return false;
        }
        if (!response.ok) return false;
        const data = (await response.json()) as {
          presence?: ResourcePresence[];
        };
        if (active && Array.isArray(data.presence)) setPresence(data.presence);
        return true;
      } catch {
        return false;
      }
    };

    const beat = async (): Promise<void> => {
      if (await beatHub()) return;
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

    // Joins and leaves pushed by the hub update the list immediately.
    const unsubscribe = subscribeOrgRealtime((event) => {
      if (
        event.type === 'presence.changed' &&
        event.resourceId === resourceId &&
        Array.isArray(event.presence)
      ) {
        setPresence(event.presence);
      }
    });

    void beat();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void beat();
    }, HEARTBEAT_MS);
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void beat();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, options.resourceId, options.resourceType]);

  return presence;
}
