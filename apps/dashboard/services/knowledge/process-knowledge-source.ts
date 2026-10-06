import 'server-only';

import { prisma } from '@/lib/db/prisma';

type ProcessKnowledgeSourceOptions = {
  textContent?: string;
};

export async function processKnowledgeSource(
  sourceId: string,
  options: ProcessKnowledgeSourceOptions = {}
): Promise<void> {
  const source = await prisma.knowledgeSource.findUnique({
    where: { id: sourceId },
    select: { id: true, agentId: true, title: true, url: true }
  });
  if (!source) {
    return;
  }

  const text = options.textContent?.trim();
  if (text) {
    await prisma.$transaction(async (tx) => {
      await tx.chunk.deleteMany({ where: { sourceId: source.id } });
      await tx.chunk.create({
        data: {
          sourceId: source.id,
          agentId: source.agentId,
          content: text,
          heading: source.title,
          tokenCount: Math.max(1, Math.ceil(text.length / 4)),
          chunkIndex: 0
        }
      });
    });
  }

  await prisma.knowledgeSource.update({
    where: { id: source.id },
    data: {
      status: 'READY',
      lastSyncedAt: new Date(),
      errorMessage: null,
      pageCount: text ? 1 : source.url ? 1 : 0
    }
  });
}

export async function processPendingKnowledgeSources(
  agentId: string
): Promise<void> {
  const pending = await prisma.knowledgeSource.findMany({
    where: {
      agentId,
      status: {
        in: ['PENDING', 'QUEUED', 'EXTRACTING', 'PROCESSING', 'INDEXING']
      }
    },
    select: { id: true }
  });
  for (const source of pending) {
    await processKnowledgeSource(source.id);
  }
}

export async function reprocessKnowledgeSources(
  _agentId: string
): Promise<void> {
  // Hybrid RAG is Cloud-only; Self-Host stores files for a BYO embed hook.
}

export async function rescanKnowledgeSource(sourceId: string): Promise<void> {
  await processKnowledgeSource(sourceId);
}

export async function runScheduledKnowledgeRescans(): Promise<{
  scanned: number;
}> {
  return { scanned: 0 };
}
