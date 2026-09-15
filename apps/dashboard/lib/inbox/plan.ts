import { getEffectivePlan, type PlanAddOns } from '@humaner/shared/plans';

/**
 * Connected mailboxes (provider logins) the workspace may hold: what the plan
 * includes plus any purchased mailbox add-ons. Redirect aliases are free and
 * never counted.
 */
export function getMailboxInboxLimit(
  orgTier: string,
  includedMessages?: number | null,
  addOns?: PlanAddOns
): number {
  return getEffectivePlan(orgTier, includedMessages, addOns).mailboxAliases;
}

/** @deprecated Use getMailboxInboxLimit — aliases no longer consume quota. */
export function getMailboxAliasLimit(
  orgTier: string,
  includedMessages?: number | null,
  addOns?: PlanAddOns
): number {
  return getMailboxInboxLimit(orgTier, includedMessages, addOns);
}

export function canUseCollaborativeMailbox(orgTier: string): boolean {
  return getMailboxInboxLimit(orgTier) > 0;
}
