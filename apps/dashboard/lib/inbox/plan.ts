import { getPlanForTier } from '@humaner/shared/plans';

export function getMailboxAliasLimit(orgTier: string): number {
  return getPlanForTier(orgTier).mailboxAliases;
}

export function canUseCollaborativeMailbox(orgTier: string): boolean {
  return getMailboxAliasLimit(orgTier) > 0;
}
