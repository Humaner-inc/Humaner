import 'server-only';

import type { OrgRealtimeEvent, ResourcePresence } from '@/lib/realtime/types';

export type {
  OrgRealtimeEvent,
  OrgRealtimeEventType,
  ResourcePresence
} from '@/lib/realtime/types';

/**
 * Self-Host (OSS) twin of `lib/realtime/org-events.ts`.
 *
 * Cloud buffers org events and presence in Upstash Redis so every serverless
 * instance sees the same stream. Self-Host runs one long-lived Node process, so
 * the same Server Action that publishes and the SSE connection that drains share
 * this module's memory. The SSE route (`app/api/dashboard/realtime/route.ts`)
 * already polls `readOrgEventsSince` on an interval, so live ticket updates and
 * presence work with no external service and no schema change.
 *
 * Trade-off: events only reach clients connected to the *same* replica. Single
 * container (the normal Self-Host deployment) is unaffected. To fan out across
 * replicas, back these two functions with Redis or a Postgres `OrgEvent` table.
 */

const MAX_EVENTS = 100;
const EVENT_TTL_MS = 300_000;
const PRESENCE_TTL_MS = 45_000;

const eventsByOrg = new Map<string, OrgRealtimeEvent[]>();
const presenceByKey = new Map<string, Map<string, ResourcePresence>>();

function pruneEvents(events: OrgRealtimeEvent[]): OrgRealtimeEvent[] {
  const cutoff = Date.now() - EVENT_TTL_MS;
  const live = events.filter((event) => event.at >= cutoff);
  return live.length > MAX_EVENTS ? live.slice(live.length - MAX_EVENTS) : live;
}

export async function publishOrgEvent(
  organizationId: string,
  event: Omit<OrgRealtimeEvent, 'id' | 'at'> & { at?: number }
): Promise<OrgRealtimeEvent | null> {
  const payload: OrgRealtimeEvent = {
    id: crypto.randomUUID(),
    at: event.at ?? Date.now(),
    type: event.type,
    resourceId: event.resourceId,
    actorId: event.actorId,
    actorName: event.actorName
  };

  const existing = eventsByOrg.get(organizationId) ?? [];
  existing.push(payload);
  eventsByOrg.set(organizationId, pruneEvents(existing));
  return payload;
}

export async function readOrgEventsSince(
  organizationId: string,
  sinceAt: number,
  limit = 50
): Promise<OrgRealtimeEvent[]> {
  const events = eventsByOrg.get(organizationId);
  if (!events) return [];

  const live = pruneEvents(events);
  eventsByOrg.set(organizationId, live);

  return live
    .filter((event) => event.at > sinceAt)
    .sort((a, b) => a.at - b.at)
    .slice(0, limit);
}

function presenceKey(
  organizationId: string,
  resourceType: 'ticket' | 'thread',
  resourceId: string
): string {
  return `${organizationId}:${resourceType}:${resourceId}`;
}

function livePresence(
  entries: Map<string, ResourcePresence>
): ResourcePresence[] {
  const cutoff = Date.now() - PRESENCE_TTL_MS;
  for (const [userId, presence] of entries) {
    if (presence.at < cutoff) {
      entries.delete(userId);
    }
  }
  return [...entries.values()];
}

export async function heartbeatPresence(input: {
  organizationId: string;
  resourceType: 'ticket' | 'thread';
  resourceId: string;
  userId: string;
  userName: string;
}): Promise<ResourcePresence[]> {
  const key = presenceKey(
    input.organizationId,
    input.resourceType,
    input.resourceId
  );
  const entries = presenceByKey.get(key) ?? new Map<string, ResourcePresence>();
  entries.set(input.userId, {
    userId: input.userId,
    userName: input.userName,
    at: Date.now()
  });
  presenceByKey.set(key, entries);

  void publishOrgEvent(input.organizationId, {
    type: 'presence.changed',
    resourceId: input.resourceId,
    actorId: input.userId,
    actorName: input.userName
  });

  return livePresence(entries);
}

export async function getResourcePresence(input: {
  organizationId: string;
  resourceType: 'ticket' | 'thread';
  resourceId: string;
}): Promise<ResourcePresence[]> {
  const key = presenceKey(
    input.organizationId,
    input.resourceType,
    input.resourceId
  );
  const entries = presenceByKey.get(key);
  return entries ? livePresence(entries) : [];
}
