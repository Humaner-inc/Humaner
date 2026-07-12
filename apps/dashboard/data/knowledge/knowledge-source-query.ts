import 'server-only';

import type { SourceType, SyncStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export type KnowledgeSourceItem = {
  id: string;
  type: SourceType;
  title: string;
  url: string | null;
  status: SyncStatus;
  pageCount: number | null;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
};

const knowledgeSourceSelect = {
  id: true,
  type: true,
  title: true,
  url: true,
  status: true,
  pageCount: true,
  lastSyncedAt: true,
  errorMessage: true,
  createdAt: true
} as const;

export async function queryKnowledgeSourcesForAgent(
  agentId: string,
  organizationId: string
): Promise<KnowledgeSourceItem[]> {
  return prisma.knowledgeSource.findMany({
    where: {
      agentId,
      agent: { organizationId }
    },
    select: knowledgeSourceSelect,
    orderBy: { createdAt: 'desc' }
  });
}

export type CreatedKnowledgeSourceItem = KnowledgeSourceItem;

export { knowledgeSourceSelect };
