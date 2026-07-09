'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';

const updateTrainingTopicsSchema = z.object({
  agentId: z.string().uuid(),
  topics: z.array(z.string().trim().min(1).max(120)).max(20)
});

export const updateTrainingTopics = pageActionClient('agents')
  .metadata({ actionName: 'updateTrainingTopics' })
  .schema(updateTrainingTopicsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
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

    const topics = Array.from(
      new Map(
        parsedInput.topics.map((topic) => [topic.toLowerCase(), topic.trim()])
      ).values()
    );

    await prisma.agent.update({
      where: { id: parsedInput.agentId },
      data: { trainingTopics: topics }
    });

    revalidatePath(Routes.Training);
    revalidatePath(Routes.Knowledge);

    return { topics };
  });
