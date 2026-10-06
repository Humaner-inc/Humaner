import type { OrgRealtimeEvent } from '@/lib/realtime/types';

type Listener = (event: OrgRealtimeEvent) => void;

const listeners = new Set<Listener>();

/** Fan-out for the single org SSE connection in `useOrgRealtime`. */
export function subscribeOrgRealtime(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitOrgRealtime(event: OrgRealtimeEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Ignore subscriber errors so one bad toast does not break refresh.
    }
  }
}
