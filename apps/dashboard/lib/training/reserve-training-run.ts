import 'server-only';

import {
  formatCreditUsd,
  isCreditsBillingModel,
  MESSAGE_RATE_CENTS
} from '@humaner/shared/credits';
import { getPlanForTier } from '@humaner/shared/plans';

import {
  getAccountKey,
  getAccountOrganizationIds
} from '@/lib/billing/account-scope';
import { getMessagesUsedThisMonth } from '@/lib/billing/message-usage';
import { organizationBypassesPlanLimits } from '@/lib/billing/plan-limits';
import { getTrainingMessagesUsedThisMonth } from '@/lib/billing/training-usage';
import { prisma } from '@/lib/db/prisma';
import { acquireLock } from '@/lib/redis/upstash';

/** Generous enough for the longest batch; the TTL only bounds a crashed run. */
const TRAINING_LOCK_TTL_SECONDS = 15 * 60;

export type TrainingRunReservation =
  | { allowed: true; release: () => Promise<void> }
  | { allowed: false; reason: string };

/**
 * Admit one training run for an account.
 *
 * Training questions are billed against the credits wallet (or monthly
 * allotment on Polar volume), and
 * the check is a read followed by a long-running write. Two runs started at
 * once would both read the same usage and both pass, so runs are serialized
 * per account — the lock makes the check and the spend atomic with respect to
 * each other. It is also the behaviour we want regardless: one batch at a time.
 */
export async function reserveTrainingRun(input: {
  organizationId: string;
  questionCount: number;
  tier: string;
}): Promise<TrainingRunReservation> {
  if (await organizationBypassesPlanLimits(input.organizationId)) {
    return { allowed: true, release: async () => {} };
  }

  const accountKey = await getAccountKey(input.organizationId);
  const release = await acquireLock(
    `training-run:${accountKey}`,
    TRAINING_LOCK_TTL_SECONDS
  );
  if (!release) {
    return {
      allowed: false,
      reason:
        'A training run is already in progress for this account. Wait for it to finish before starting another.'
    };
  }

  const plan = getPlanForTier(input.tier);
  const accountOrganizationIds = await getAccountOrganizationIds(
    input.organizationId
  );
  const [trainingUsed, messagesUsed] = await Promise.all([
    getTrainingMessagesUsedThisMonth(accountOrganizationIds),
    getMessagesUsedThisMonth(input.organizationId, input.tier)
  ]);

  const freeRemaining = Math.max(0, plan.freeTrainingMessages - trainingUsed);
  const overageForThisRun = Math.max(0, input.questionCount - freeRemaining);

  const organization = await prisma.organization.findFirst({
    where: { id: input.organizationId },
    select: {
      billingModel: true,
      owner: { select: { billingModel: true, creditBalanceCents: true } }
    }
  });
  const billingModel =
    organization?.owner?.billingModel ?? organization?.billingModel;
  const walletCents = organization?.owner?.creditBalanceCents ?? 0;

  if (
    overageForThisRun > 0 &&
    isCreditsBillingModel(billingModel) &&
    walletCents < overageForThisRun * MESSAGE_RATE_CENTS
  ) {
    await release();
    return {
      allowed: false,
      reason: `This run needs ${formatCreditUsd(overageForThisRun * MESSAGE_RATE_CENTS)} in credits beyond the free training allowance. ${formatCreditUsd(walletCents)} left in the wallet.`
    };
  }

  // Hard-cap tiers (no paid overage) cannot dip into a quota that's already
  // exhausted — Polar volume deducts overage from the regular message plan.
  if (
    overageForThisRun > 0 &&
    !isCreditsBillingModel(billingModel) &&
    plan.overagePerMessage === null &&
    messagesUsed + overageForThisRun > plan.includedMessages
  ) {
    await release();
    return {
      allowed: false,
      reason:
        trainingUsed >= plan.freeTrainingMessages
          ? `You've used all ${plan.freeTrainingMessages} free training questions this month, and your ${plan.name} message quota is exhausted. Upgrade to keep testing.`
          : `Only ${freeRemaining} free training question${freeRemaining === 1 ? '' : 's'} left this month, and your ${plan.name} message quota can't cover the rest. Try a smaller batch or upgrade.`
    };
  }

  return { allowed: true, release };
}
