export type OrgRealtimeEventType =
  | 'ticket.updated'
  | 'thread.updated'
  | 'agent.changed'
  | 'inbox.synced'
  | 'presence.changed';

export type OrgRealtimeEvent = {
  id: string;
  type: OrgRealtimeEventType;
  resourceId?: string;
  actorId?: string;
  actorName?: string;
  /** Messages imported for `inbox.synced` (when known). */
  count?: number;
  at: number;
};

export type ResourcePresence = {
  userId: string;
  userName: string;
  at: number;
};
