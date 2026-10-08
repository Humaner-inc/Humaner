export type OrgRealtimeEventType =
  | 'ticket.updated'
  | 'thread.updated'
  | 'agent.changed'
  | 'inbox.synced'
  | 'connector.activity'
  | 'presence.changed';

export type OrgRealtimeEvent = {
  id: string;
  type: OrgRealtimeEventType;
  resourceId?: string;
  actorId?: string;
  actorName?: string;
  /** Messages imported for `inbox.synced` (when known). */
  count?: number;
  /** Full viewer list for `presence.changed` pushed by the hub. */
  presence?: ResourcePresence[];
  at: number;
};

export type ResourcePresence = {
  userId: string;
  userName: string;
  at: number;
};
