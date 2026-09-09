export type SidebarMessageUsageDto = {
  messagesUsed: number;
  includedMessages: number;
  creditsUsedCents: number;
  creditsIncludedCents: number;
  tier: string;
  operatorOwnedQuota?: boolean;
};
