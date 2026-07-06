'use server';

import { revalidatePath } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { getPlanForTier } from '@humaner/shared/plans';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { getAccountOrganizationIds } from '@/lib/billing/account-scope';
import { getMessagesUsedThisMonth } from '@/lib/billing/message-usage';
import { organizationBypassesPlanLimits } from '@/lib/billing/plan-limits';
import { getTrainingMessagesUsedThisMonth } from '@/lib/billing/training-usage';
import { prisma } from '@/lib/db/prisma';
import {
  GatewayError,
  NotFoundError,
  PreConditionError
} from '@/lib/validation/exceptions';
import { runAgentEval } from '@/services/training/agent-eval';

const QUESTION_COUNT_OPTIONS = [5, 10, 25, 50] as const;
type QuestionCount = (typeof QUESTION_COUNT_OPTIONS)[number];

const runAgentTrainingSchema = z.object({
  agentId: z.string().uuid(),
  questionCount: z
    .number()
    .refine(
      (n): n is QuestionCount =>
        QUESTION_COUNT_OPTIONS.includes(n as QuestionCount),
      { message: 'Question count must be 5, 10, 25, or 50' }
    )
    .optional()
    .default(25)
});

export const runAgentTraining = pageActionClient('knowledge')
  .metadata({ actionName: 'runAgentTraining' })
  .schema(runAgentTrainingSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;

    const agent = await prisma.agent.findFirst({
      where: {
        id: parsedInput.agentId,
        organizationId
      },
      select: { id: true }
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    const organization = await prisma.organization.findFirst({
      where: { id: organizationId },
      select: { tier: true }
    });
    const tier = organization?.tier ?? 'free';
    const plan = getPlanForTier(tier);

    const bypassLimits = await organizationBypassesPlanLimits(organizationId);

    if (!bypassLimits) {
      const accountOrganizationIds = await getAccountOrganizationIds(organizationId);
      const [trainingUsed, messagesUsed] = await Promise.all([
        getTrainingMessagesUsedThisMonth(accountOrganizationIds),
        getMessagesUsedThisMonth(organizationId, tier)
      ]);

      const freeRemaining = Math.max(
        0,
        plan.freeTrainingMessages - trainingUsed
      );
      const overageForThisRun = Math.max(
        0,
        parsedInput.questionCount - freeRemaining
      );

      if (
        overageForThisRun > 0 &&
        plan.overagePerMessage === null &&
        messagesUsed + overageForThisRun > plan.includedMessages
      ) {
        throw new PreConditionError(
          `You've used your ${plan.freeTrainingMessages} free training questions this month, and the ${plan.name} plan's message quota is exhausted. Upgrade to keep testing.`
        );
      }
    }

    try {
      const result = await runAgentEval(
        parsedInput.agentId,
        parsedInput.questionCount,
        tier
      );

      revalidatePath(Routes.Training);
      revalidatePath(Routes.Knowledge);

      return result;
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new GatewayError(
          error.status === 404
            ? 'Training model is unavailable. Please contact support.'
            : error.message
        );
      }

      if (error instanceof Error && error.message.includes('API_KEY')) {
        throw new GatewayError('AI provider is not configured for training.');
      }

      throw error;
    }
  });
