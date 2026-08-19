import 'server-only';

import { prisma } from '@/lib/db/prisma';
import type { KnowledgeGapCover } from '@/lib/knowledge/filter-covered-content-gaps';

export async function queryKnowledgeGapCoversForAgent(
  agentId: string,
  organizationId: string
): Promise<KnowledgeGapCover[]> {
  const sources = await prisma.knowledgeSource.findMany({
    where: {
      agentId,
      agent: { organizationId }
    },
    select: {
      agentId: true,
      title: true,
      createdAt: true
    }
  });

  return sources.map((source) => ({
    agentId: source.agentId,
    title: source.title,
    coveredAt: source.createdAt
  }));
}

export async function queryKnowledgeGapCoversForOrganization(
  organizationId: string,
  agentId?: string
): Promise<KnowledgeGapCover[]> {
  const sources = await prisma.knowledgeSource.findMany({
    where: {
      agent: {
        organizationId,
        ...(agentId ? { id: agentId } : {})
      }
    },
    select: {
      agentId: true,
      title: true,
      createdAt: true
    }
  });

  return sources.map((source) => ({
    agentId: source.agentId,
    title: source.title,
    coveredAt: source.createdAt
  }));
}
