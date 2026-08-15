import { revalidatePath } from 'next/cache';
import { runAgentEval } from '@/services/training/agent-eval';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { reserveTrainingRun } from '@/lib/training/reserve-training-run';
import type { TrainingProgressEvent } from '@/lib/training/training-progress';

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
    return Response.json(
      { error: 'Invalid training request' },
      { status: 400 }
    );
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

  const reservation = await reserveTrainingRun({
    organizationId,
    questionCount: parsed.data.questionCount,
    tier
  });
  if (!reservation.allowed) {
    return Response.json({ error: reservation.reason }, { status: 429 });
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
      } finally {
        await reservation.release();
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
