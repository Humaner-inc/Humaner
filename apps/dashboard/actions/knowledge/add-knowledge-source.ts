'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { processKnowledgeSource } from '@/services/knowledge/process-knowledge-source';

import { pageActionClientAny } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import {
  knowledgeSourceSelect,
  type CreatedKnowledgeSourceItem
} from '@/data/knowledge/knowledge-source-query';
import { assertCanMutateDemoAgent } from '@/lib/admin-demos/assert-can-mutate-demo-agent';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { addKnowledgeSourceSchema } from '@/schemas/knowledge/add-knowledge-source-schema';

function deriveTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segment = parsed.pathname.split('/').filter(Boolean).pop();
    const label = segment ? segment.replace(/[-_]+/g, ' ') : parsed.hostname;
    return label.slice(0, 255);
  } catch {
    return url.slice(0, 255);
  }
}

export const addKnowledgeSource = pageActionClientAny('agents', 'inbox')
  .metadata({ actionName: 'addKnowledgeSource' })
  .schema(addKnowledgeSourceSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const agent = await prisma.agent.findFirst({
      where: {
        id: parsedInput.agentId,
        organizationId: session.user.organizationId
      },
      select: { id: true, organizationId: true, role: true }
    });
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }
    await assertCanMutateDemoAgent(agent.role, session.user.id);

    const createdSources: CreatedKnowledgeSourceItem[] = [];

    if (parsedInput.type === 'URL') {
      const urls = parsedInput.urls ?? [];
      for (const url of urls) {
        const source = await prisma.knowledgeSource.create({
          data: {
            agentId: agent.id,
            type: 'URL',
            title: parsedInput.title?.trim() || deriveTitleFromUrl(url),
            url,
            status: 'READY',
            lastSyncedAt: new Date(),
            pageCount: 1
          },
          select: knowledgeSourceSelect
        });
        createdSources.push(source);
      }
    } else if (parsedInput.type === 'SITEMAP' || parsedInput.type === 'API') {
      const url = parsedInput.url as string;
      const source = await prisma.knowledgeSource.create({
        data: {
          agentId: agent.id,
          type: parsedInput.type,
          title: parsedInput.title?.trim() || deriveTitleFromUrl(url),
          url,
          status: 'READY',
          lastSyncedAt: new Date(),
          pageCount: 1
        },
        select: knowledgeSourceSelect
      });
      createdSources.push(source);
    } else {
      const source = await prisma.knowledgeSource.create({
        data: {
          agentId: agent.id,
          type: 'TEXT',
          title: parsedInput.title as string,
          status: 'PENDING'
        },
        select: knowledgeSourceSelect
      });
      await processKnowledgeSource(source.id, {
        textContent: parsedInput.content?.trim()
      });
      const ready = await prisma.knowledgeSource.findUnique({
        where: { id: source.id },
        select: knowledgeSourceSelect
      });
      if (ready) {
        createdSources.push(ready);
      }
    }

    for (const source of createdSources) {
      await recordAuditEvent({
        organizationId: session.user.organizationId,
        eventType: 'knowledge.source_added',
        actorId: session.user.id,
        actorEmail: session.user.email,
        resourceType: 'knowledge_source',
        resourceId: source.id,
        after: {
          type: source.type,
          title: source.title,
          url: source.url ?? null,
          agentId: agent.id
        }
      });
    }

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.KnowledgeSources,
        session.user.organizationId,
        agent.id
      ),
      'max'
    );
    revalidatePath(Routes.Resources);

    return { sources: createdSources };
  });
