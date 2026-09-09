import { resolveCreditUsage } from '@humaner/shared/credits';

type WalletSource = {
  billingModel?: string | null;
  creditBalanceCents?: number | null;
  owner?: {
    billingModel?: string | null;
    creditBalanceCents?: number | null;
  } | null;
};

/** Owner User is the wallet; Organization is a mirror. */
export function creditWalletFromAccount(account: WalletSource): {
  billingModel: string | null | undefined;
  creditBalanceCents: number;
} {
  return {
    billingModel: account.owner?.billingModel ?? account.billingModel,
    creditBalanceCents:
      account.owner?.creditBalanceCents ?? account.creditBalanceCents ?? 0
  };
}

export function creditUsageForAccount(
  account: WalletSource,
  input: { messagesUsed: number; includedMessages: number }
) {
  const wallet = creditWalletFromAccount(account);
  return resolveCreditUsage({
    billingModel: wallet.billingModel,
    creditBalanceCents: wallet.creditBalanceCents,
    messagesUsed: input.messagesUsed,
    includedMessages: input.includedMessages
  });
}
