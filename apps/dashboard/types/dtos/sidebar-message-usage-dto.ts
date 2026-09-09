export type SidebarMessageUsageDto = {
  messagesUsed: number;
  includedMessages: number;
  creditsUsedCents: number;
  creditsIncludedCents: number;
  creditsRemainingCents: number;
  billingModel: string;
  tier: string;
  operatorOwnedQuota?: boolean;
};
