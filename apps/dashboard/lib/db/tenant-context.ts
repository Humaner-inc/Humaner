import 'server-only';

import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request-scoped organization id for Prisma tenant injection.
 * Set by authActionClient (and similar) so dashboard mutations/queries that
 * forget `organizationId` still stay within the active workspace.
 */
const tenantStorage = new AsyncLocalStorage<string>();

export function getTenantOrganizationId(): string | undefined {
  return tenantStorage.getStore();
}

export function runWithTenantScope<T>(organizationId: string, fn: () => T): T {
  return tenantStorage.run(organizationId, fn);
}

/**
 * Models that carry a top-level `organizationId` and should receive automatic
 * scoping when a tenant context is active. Membership / join-request models are
 * intentionally excluded — they are often queried across workspaces.
 */
export const TENANT_SCOPED_MODELS = new Set([
  'Agent',
  'AgentIntegration',
  'ApiKey',
  'AuditLog',
  'CalendarConnection',
  'CalendarEvent',
  'EscalationPolicy',
  'HandoffTicket',
  'Invitation',
  'MailAlias',
  'MailboxConnection',
  'MailTag',
  'MailThread',
  'TeamMemberProfile',
  'VisitorMetadata',
  'Webhook',
  'WorkHours'
]);
