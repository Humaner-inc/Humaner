import { isOssDeployment } from '@/lib/deployment-mode';
import { getMailboxInboxLimit } from '@/lib/inbox/plan';

export type MailboxConnectOrg = {
  tier: string;
  includedMessages: number | null;
  extraSeats: number;
  extraMailboxes: number;
  completedOnboarding?: boolean;
  _count: { mailboxConnections: number };
};

export type MailboxConnectQuota = {
  inboxLimit: number;
  effectiveLimit: number;
  connectionCount: number;
  remaining: number;
  onboardingConnect: boolean;
};

export async function orgWithGrantedAddOns(
  _organizationId: string,
  organization: MailboxConnectOrg
): Promise<MailboxConnectOrg> {
  return organization;
}

export function mailboxConnectQuotaFromOrg(
  organization: MailboxConnectOrg,
  options?: { onboardingConnect?: boolean }
): MailboxConnectQuota {
  const inboxLimit = getMailboxInboxLimit(
    organization.tier,
    organization.includedMessages,
    organization
  );
  const onboardingConnect =
    options?.onboardingConnect ?? organization.completedOnboarding === false;
  const effectiveLimit = Math.max(inboxLimit, 1);

  return {
    inboxLimit,
    effectiveLimit,
    connectionCount: organization._count.mailboxConnections,
    remaining: effectiveLimit - organization._count.mailboxConnections,
    onboardingConnect
  };
}

export function mailboxPlanFullMessage(limit: number): string {
  return `This deployment covers ${limit} connected mailbox${limit === 1 ? '' : 'es'}.`;
}

export type NewMailboxSlotDecision =
  | { kind: 'ok' }
  | { kind: 'needsMailbox'; canApplyToBill: boolean }
  | { kind: 'requiresInbox' }
  | { kind: 'planFull'; message: string };

export async function resolveNewMailboxSlot(input: {
  organizationId: string;
  userId: string;
  email: string;
  name: string | null;
  quota: MailboxConnectQuota;
}): Promise<NewMailboxSlotDecision> {
  if (input.quota.remaining > 0 || isOssDeployment()) {
    return { kind: 'ok' };
  }
  return {
    kind: 'planFull',
    message: mailboxPlanFullMessage(input.quota.effectiveLimit)
  };
}
