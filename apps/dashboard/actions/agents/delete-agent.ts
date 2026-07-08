'use server';

import { revalidateTag } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { invalidateAgentConfigCache } from '@/lib/redis/agent-config-cache';
import { NotFoundError } from '@/lib/validation/exceptions';
import { purgeVisitorMemory } from '@/services/agent-memory';
import { deleteAgentSchema } from '@/schemas/agents/delete-agent-schema';
import { invalidateLangCacheForAgent } from '@/services/langcache';

export const deleteAgent = pageActionClient('agents')
  .metadata({ actionName: 'deleteAgent' })
  .schema(deleteAgentSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const agent = await prisma.agent.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: { id: true, publicId: true }
    });
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    const conversations = await prisma.conversation.findMany({
      where: { agentId: agent.id },
      select: { visitorId: true },
      distinct: ['visitorId']
    });

    for (const { visitorId } of conversations) {
      await purgeVisitorMemory(visitorId);
    }

    await Promise.all([
      invalidateAgentConfigCache(agent.publicId),
      invalidateLangCacheForAgent(agent.id)
    ]);

    await prisma.agent.delete({
      where: { id: agent.id }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Agents,
        session.user.organizationId
      )
    );
  });
