import { getEffectivePlan } from '@humaner/shared/plans';

/** Connected mailboxes (provider logins) included on the plan. Aliases are free. */
export function getMailboxInboxLimit(
  orgTier: string,
  includedMessages?: number | null
): number {
  return getEffectivePlan(orgTier, includedMessages).mailboxAliases;
}

/** @deprecated Use getMailboxInboxLimit — aliases no longer consume quota. */
export function getMailboxAliasLimit(
  orgTier: string,
  includedMessages?: number | null
): number {
  return getMailboxInboxLimit(orgTier, includedMessages);
}

export function canUseCollaborativeMailbox(orgTier: string): boolean {
  return getMailboxInboxLimit(orgTier) > 0;
}
