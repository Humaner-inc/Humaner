'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { after } from 'next/server';
import { rescanKnowledgeSource } from '@/services/knowledge/process-knowledge-source';

import { pageActionClientAny } from '@/actions/safe-action';
import { agentKnowledgeRoute, Routes } from '@/constants/routes';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { rescanKnowledgeSourceSchema } from '@/schemas/knowledge/rescan-knowledge-source-schema';

export const rescanKnowledgeSourceAction = pageActionClientAny(
  'agents',
  'inbox'
)
  .metadata({ actionName: 'rescanKnowledgeSource' })
  .schema(rescanKnowledgeSourceSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const source = await prisma.knowledgeSource.findFirst({
      where: {
        id: parsedInput.id,
        agent: { organizationId: session.user.organizationId }
      },
      select: { id: true, agentId: true, type: true }
    });

    if (!source) {
      throw new NotFoundError('Knowledge source not found');
    }

    if (!['URL', 'SITEMAP', 'API'].includes(source.type)) {
      return { queued: false };
    }

    after(async () => {
      await rescanKnowledgeSource(source.id);
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.KnowledgeSources,
        session.user.organizationId,
        source.agentId
      ),
      'max'
    );
    revalidatePath(agentKnowledgeRoute(source.agentId));
    revalidatePath(Routes.Resources);

    return { queued: true };
  });
