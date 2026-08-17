'use server';

import { revalidateTag } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { invalidateAgentConfigCache } from '@/lib/redis/agent-config-cache';
import { NotFoundError } from '@/lib/validation/exceptions';
import { toggleAgentPauseSchema } from '@/schemas/agents/toggle-agent-pause-schema';

export const toggleAgentPause = pageActionClient('agents')
  .metadata({ actionName: 'toggleAgentPause' })
  .schema(toggleAgentPauseSchema)
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

    await prisma.agent.update({
      where: { id: agent.id },
      data: { isPaused: parsedInput.isPaused }
    });

    await invalidateAgentConfigCache(agent.publicId);

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Agents,
        session.user.organizationId
      ),
      'max'
    );
  });
