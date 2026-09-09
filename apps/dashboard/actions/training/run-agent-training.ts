'use server';

import { revalidatePath } from 'next/cache';
import { runAgentEval } from '@/services/training/agent-eval';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { debitTrainingOverageCredits } from '@/lib/billing/training-usage';
import { prisma } from '@/lib/db/prisma';
import { reserveTrainingRun } from '@/lib/training/reserve-training-run';
import {
  GatewayError,
  NotFoundError,
  PreConditionError
} from '@/lib/validation/exceptions';

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

export const runAgentTraining = pageActionClient('agents')
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

    const reservation = await reserveTrainingRun({
      organizationId,
      questionCount: parsedInput.questionCount,
      tier
    });
    if (!reservation.allowed) {
      throw new PreConditionError(reservation.reason);
    }

    try {
      const result = await runAgentEval(
        parsedInput.agentId,
        parsedInput.questionCount,
        tier
      );
      await debitTrainingOverageCredits(
        organizationId,
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
    } finally {
      await reservation.release();
    }
  });
