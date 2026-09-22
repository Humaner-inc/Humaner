import 'server-only';

import { subDays } from 'date-fns';

import { getMessageRetentionDays } from '@/lib/data-retention/constants';
import { prisma } from '@/lib/db/prisma';

const BATCH_SIZE = 200;
const MAX_BATCHES_PER_RUN = 500;

export type PurgeExpiredMessagesResult = {
  conversationsDeleted: number;
  retentionDays: number;
  cutoff: string;
};

export async function purgeExpiredMessages(): Promise<PurgeExpiredMessagesResult> {
  const retentionDays = getMessageRetentionDays();
  const cutoff = subDays(new Date(), retentionDays);
  let conversationsDeleted = 0;

  for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
    const stale = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT c.id
      FROM "Conversation" c
      LEFT JOIN LATERAL (
        SELECT MAX(m."createdAt") AS last_message_at
        FROM "Message" m
        WHERE m."conversationId" = c.id
      ) latest ON true
      WHERE (
        latest.last_message_at IS NULL AND c."createdAt" < ${cutoff}
      ) OR (
        latest.last_message_at < ${cutoff}
      )
      LIMIT ${BATCH_SIZE}
    `;

    if (stale.length === 0) {
      break;
    }

    for (const row of stale) {
      await prisma.conversation.delete({ where: { id: row.id } });
    }

    conversationsDeleted += stale.length;

    if (stale.length < BATCH_SIZE) {
      break;
    }
  }

  return {
    conversationsDeleted,
    retentionDays,
    cutoff: cutoff.toISOString()
  };
}
