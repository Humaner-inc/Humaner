import { revalidatePath } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { getPlanForTier } from '@humaner/shared/plans';

import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { getMessagesUsedThisMonth } from '@/lib/billing/message-usage';
import { organizationBypassesPlanLimits } from '@/lib/billing/plan-limits';
import { getTrainingMessagesUsedThisMonth } from '@/lib/billing/training-usage';
import { prisma } from '@/lib/db/prisma';
import type { TrainingProgressEvent } from '@/lib/training/training-progress';
import { runAgentEval } from '@/services/training/agent-eval';

export const maxDuration = 300;

const QUESTION_COUNT_OPTIONS = [5, 10, 25, 50] as const;

const runTrainingSchema = z.object({
  agentId: z.string().uuid(),
  questionCount: z
    .number()
    .refine((value) =>
      QUESTION_COUNT_OPTIONS.includes(
        value as (typeof QUESTION_COUNT_OPTIONS)[number]
      )
    )
});

function trainingErrorMessage(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    return error.status === 404
      ? 'Training model is unavailable. Please contact support.'
      : error.message;
  }

  if (error instanceof Error && error.message.includes('API_KEY')) {
    return 'AI provider is not configured for training.';
  }

  return error instanceof Error
    ? error.message
    : 'Training failed unexpectedly';
}

export async function POST(request: Request): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = runTrainingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid training request' }, { status: 400 });
  }

  const agent = await prisma.agent.findFirst({
    where: {
      id: parsed.data.agentId,
      organizationId: session.user.organizationId
    },
    select: { id: true }
  });

  if (!agent) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  const organizationId = session.user.organizationId;
  const organization = await prisma.organization.findFirst({
    where: { id: organizationId },
    select: { tier: true }
  });
  const tier = organization?.tier ?? 'free';
  const plan = getPlanForTier(tier);

  const bypassLimits = await organizationBypassesPlanLimits(organizationId);

  if (!bypassLimits) {
    const [trainingUsed, messagesUsed] = await Promise.all([
      getTrainingMessagesUsedThisMonth(organizationId),
      getMessagesUsedThisMonth(organizationId, tier)
    ]);

    const freeRemaining = Math.max(0, plan.freeTrainingMessages - trainingUsed);
    const overageForThisRun = Math.max(
      0,
      parsed.data.questionCount - freeRemaining
    );

    // Hard-cap tiers (no paid overage) cannot dip into a quota that's already
    // exhausted — everyone else deducts overage from the regular message plan.
    if (
      overageForThisRun > 0 &&
      plan.overagePerMessage === null &&
      messagesUsed + overageForThisRun > plan.includedMessages
    ) {
      return Response.json(
        {
          error:
            trainingUsed >= plan.freeTrainingMessages
              ? `You've used all ${plan.freeTrainingMessages} free training questions this month, and your ${plan.name} message quota is exhausted. Upgrade to keep testing.`
              : `Only ${freeRemaining} free training question${freeRemaining === 1 ? '' : 's'} left this month, and your ${plan.name} message quota can't cover the rest. Try a smaller batch or upgrade.`
        },
        { status: 429 }
      );
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: TrainingProgressEvent): void => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        await runAgentEval(
          parsed.data.agentId,
          parsed.data.questionCount,
          tier,
          send
        );

        revalidatePath(Routes.Training);
        revalidatePath(Routes.Knowledge);

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        send({ type: 'error', message: trainingErrorMessage(error) });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
