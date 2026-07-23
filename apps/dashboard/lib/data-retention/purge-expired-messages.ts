import 'server-only';

import { subDays } from 'date-fns';

import { getMessageRetentionDays } from '@/lib/data-retention/constants';
import { prisma } from '@/lib/db/prisma';

const BATCH_SIZE = 200;

export type PurgeExpiredMessagesResult = {
  conversationsDeleted: number;
  retentionDays: number;
  cutoff: string;
};

/**
 * Hard-delete stale conversation transcripts (GDPR data minimisation / storage).
 *
 * Does **not** touch Redis Iris agent memory. Cross-session visitor memory is the
 * product layer for returning customers and must outlive transcript retention.
 * Iris is only cleared on explicit erasure (visitor delete, org delete, agent delete).
 */
export async function purgeExpiredMessages(): Promise<PurgeExpiredMessagesResult> {
  const retentionDays = getMessageRetentionDays();
  const cutoff = subDays(new Date(), retentionDays);
  let conversationsDeleted = 0;

  while (true) {
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

    const deleted = await prisma.conversation.deleteMany({
      where: { id: { in: stale.map((row) => row.id) } }
    });

    conversationsDeleted += deleted.count;

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
