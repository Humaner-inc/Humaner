'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { agentKnowledgeRoute } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateKnowledgeRescanScheduleSchema } from '@/schemas/knowledge/update-knowledge-rescan-schedule-schema';

export const updateKnowledgeRescanSchedule = pageActionClient('agents')
  .metadata({ actionName: 'updateKnowledgeRescanSchedule' })
  .schema(updateKnowledgeRescanScheduleSchema)
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

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        knowledgeRescanInterval: parsedInput.interval,
        ...(parsedInput.interval === 'NEVER'
          ? { knowledgeLastRescanAt: null }
          : {})
      }
    });

    revalidatePath(agentKnowledgeRoute(agent.id));
  });
