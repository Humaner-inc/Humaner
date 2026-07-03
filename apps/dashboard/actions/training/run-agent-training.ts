'use server';

import { revalidatePath } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import {
  getOrganizationCapabilities,
  getOrganizationPlanName
} from '@/lib/billing/capabilities';
import { prisma } from '@/lib/db/prisma';
import {
  GatewayError,
  NotFoundError,
  PreConditionError
} from '@/lib/validation/exceptions';
import { runAgentEval } from '@/services/training/agent-eval';

const QUESTION_COUNT_OPTIONS = [5, 25, 50, 100] as const;
type QuestionCount = (typeof QUESTION_COUNT_OPTIONS)[number];

const runAgentTrainingSchema = z.object({
  agentId: z.string().uuid(),
  questionCount: z
    .number()
    .refine(
      (n): n is QuestionCount =>
        QUESTION_COUNT_OPTIONS.includes(n as QuestionCount),
      { message: 'Question count must be 5, 25, 50, or 100' }
    )
    .optional()
    .default(25)
});

export const runAgentTraining = pageActionClient('training')
  .metadata({ actionName: 'runAgentTraining' })
  .schema(runAgentTrainingSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const capabilities = await getOrganizationCapabilities(
      session.user.organizationId
    );
    if (!capabilities.autoTraining) {
      const planName = await getOrganizationPlanName(
        session.user.organizationId
      );
      throw new PreConditionError(
        `Auto-training is not available on the ${planName} plan. Upgrade to Push to train from your own data.`
      );
    }

    const agent = await prisma.agent.findFirst({
      where: {
        id: parsedInput.agentId,
        organizationId: session.user.organizationId
      },
      select: { id: true }
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    try {
      const result = await runAgentEval(
        parsedInput.agentId,
        parsedInput.questionCount
      );

      revalidatePath(Routes.Training);
      revalidatePath(Routes.Agents);

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
