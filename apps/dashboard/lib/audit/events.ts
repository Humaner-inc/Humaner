export const AUDIT_EVENTS = [
  'org.created',
  'org.deleted',
  'user.login',
  'user.login_failed',
  'user.mfa_enabled',
  'api_key.created',
  'api_key.rotated',
  'api_key.deleted',
  'agent.created',
  'agent.updated',
  'agent.deleted',
  'knowledge.source_added',
  'knowledge.source_deleted',
  'knowledge.full_wipe',
  'conversation.exported',
  'billing.plan_changed',
  'billing.payment_failed',
  'member.invited',
  'member.left',
  'member.removed',
  'member.role_changed',
  'workspace.created',
  'workspace.deleted',
  'mailbox.connected',
  'mailbox.connection_failed',
  'mailbox.disconnected',
  'mailbox.alias_added',
  'mailbox.alias_removed',
  'data.deletion_requested',
  'audit.exported'
] as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[number];

export const AUDIT_EVENT_LABELS: Record<AuditEvent, string> = {
  'org.created': 'Organization created',
  'org.deleted': 'Organization deleted',
  'user.login': 'User signed in',
  'user.login_failed': 'Sign-in failed',
  'user.mfa_enabled': 'MFA enabled',
  'api_key.created': 'API key created',
  'api_key.rotated': 'API key rotated',
  'api_key.deleted': 'API key deleted',
  'agent.created': 'Agent created',
  'agent.updated': 'Companion updated',
  'agent.deleted': 'Agent deleted',
  'knowledge.source_added': 'Knowledge source added',
  'knowledge.source_deleted': 'Knowledge source deleted',
  'knowledge.full_wipe': 'Knowledge base wiped',
  'conversation.exported': 'Conversation exported',
  'billing.plan_changed': 'Billing plan changed',
  'billing.payment_failed': 'Payment failed',
  'member.invited': 'Member invited',
  'member.left': 'Member left',
  'member.removed': 'Member removed',
  'member.role_changed': 'Member access changed',
  'workspace.created': 'Workspace created',
  'workspace.deleted': 'Workspace deleted',
  'mailbox.connected': 'Mailbox connected',
  'mailbox.connection_failed': 'Mailbox connection failed',
  'mailbox.disconnected': 'Mailbox disconnected',
  'mailbox.alias_added': 'Mailbox alias added',
  'mailbox.alias_removed': 'Mailbox alias removed',
  'data.deletion_requested': 'Data deletion requested',
  'audit.exported': 'Audit logs exported'
};

/** Minimum retention for audit logs (Layer 12). */
export const AUDIT_LOG_RETENTION_MS = 2 * 365 * 24 * 60 * 60 * 1000;

export function isAuditEvent(value: string): value is AuditEvent {
  return (AUDIT_EVENTS as readonly string[]).includes(value);
}
