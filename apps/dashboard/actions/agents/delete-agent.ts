'use server';

import { revalidateTag } from 'next/cache';
import { purgeVisitorMemory } from '@/services/agent-memory';
import { invalidateLangCacheForAgent } from '@/services/langcache';

import { pageActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { prisma } from '@/lib/db/prisma';
import { invalidateAgentConfigCache } from '@/lib/redis/agent-config-cache';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteAgentSchema } from '@/schemas/agents/delete-agent-schema';

export const deleteAgent = pageActionClient('agents')
  .metadata({ actionName: 'deleteAgent' })
  .schema(deleteAgentSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const agent = await prisma.agent.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: { id: true, publicId: true, name: true }
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

    await recordAuditEvent({
      organizationId: session.user.organizationId,
      eventType: 'agent.deleted',
      actorId: session.user.id,
      actorEmail: session.user.email,
      resourceType: 'agent',
      resourceId: agent.id,
      before: { name: agent.name, publicId: agent.publicId }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Agents,
        session.user.organizationId
      ),
      'max'
    );
  });
