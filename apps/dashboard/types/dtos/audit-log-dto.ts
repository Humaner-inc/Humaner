export type AuditLogDto = {
  id: string;
  eventType: string;
  eventLabel: string;
  actorType: 'user' | 'system';
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
  resourceType?: string;
  resourceId?: string;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: unknown;
  createdAt: Date;
};
