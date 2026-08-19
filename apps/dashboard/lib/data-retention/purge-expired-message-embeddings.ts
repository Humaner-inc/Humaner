import 'server-only';

import { subDays } from 'date-fns';

import { getMessageEmbeddingRetentionDays } from '@/lib/data-retention/constants';
import { prisma } from '@/lib/db/prisma';

const BATCH_SIZE = 500;
const MAX_BATCHES_PER_RUN = 200;

export type PurgeExpiredMessageEmbeddingsResult = {
  embeddingsCleared: number;
  retentionDays: number;
  cutoff: string;
};

// Drops only clustering vectors in MessageEmbedding after the 30-day gap window.
// Does not touch Message/Conversation, Iris memory, LangCache, KnowledgeGap*,
// or PlatformGapCandidate.
export async function purgeExpiredMessageEmbeddings(): Promise<PurgeExpiredMessageEmbeddingsResult> {
  const retentionDays = getMessageEmbeddingRetentionDays();
  const cutoff = subDays(new Date(), retentionDays);
  let embeddingsCleared = 0;

  for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
    const cleared = await prisma.$executeRaw`
      DELETE FROM "MessageEmbedding"
      WHERE "messageId" IN (
        SELECT "messageId"
        FROM "MessageEmbedding"
        WHERE "createdAt" < ${cutoff}
        ORDER BY "createdAt"
        LIMIT ${BATCH_SIZE}
      )
    `;

    embeddingsCleared += Number(cleared);

    if (Number(cleared) < BATCH_SIZE) {
      break;
    }
  }

  return {
    embeddingsCleared,
    retentionDays,
    cutoff: cutoff.toISOString()
  };
}
