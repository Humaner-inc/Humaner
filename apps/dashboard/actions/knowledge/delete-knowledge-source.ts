'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { pageActionClientAny } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { assertCanMutateDemoAgent } from '@/lib/admin-demos/assert-can-mutate-demo-agent';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteKnowledgeSourceSchema } from '@/schemas/knowledge/delete-knowledge-source-schema';

export const deleteKnowledgeSource = pageActionClientAny('agents', 'inbox')
  .metadata({ actionName: 'deleteKnowledgeSource' })
  .schema(deleteKnowledgeSourceSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const source = await prisma.knowledgeSource.findFirst({
      where: {
        id: parsedInput.id,
        agent: { organizationId: session.user.organizationId }
      },
      select: {
        id: true,
        agentId: true,
        type: true,
        title: true,
        url: true,
        agent: { select: { role: true } }
      }
    });
    if (!source) {
      throw new NotFoundError('Knowledge source not found');
    }
    await assertCanMutateDemoAgent(source.agent.role, session.user.id);

    await prisma.knowledgeSource.delete({
      where: { id: source.id }
    });

    await recordAuditEvent({
      organizationId: session.user.organizationId,
      eventType: 'knowledge.source_deleted',
      actorId: session.user.id,
      actorEmail: session.user.email,
      resourceType: 'knowledge_source',
      resourceId: source.id,
      before: {
        type: source.type,
        title: source.title,
        url: source.url,
        agentId: source.agentId
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.KnowledgeSources,
        session.user.organizationId,
        source.agentId
      ),
      'max'
    );
    revalidatePath(Routes.Resources);
  });
