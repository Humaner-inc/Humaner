import 'server-only';

import { purgeVisitorMemory } from '@/services/agent-memory';
import { subDays } from 'date-fns';

import { getMessageRetentionDays } from '@/lib/data-retention/constants';
import { prisma } from '@/lib/db/prisma';

const BATCH_SIZE = 200;

export type PurgeExpiredMessagesResult = {
  conversationsDeleted: number;
  retentionDays: number;
  cutoff: string;
};

export async function purgeExpiredMessages(): Promise<PurgeExpiredMessagesResult> {
  const retentionDays = getMessageRetentionDays();
  const cutoff = subDays(new Date(), retentionDays);
  let conversationsDeleted = 0;
  const purgedVisitors = new Set<string>();

  while (true) {
    const stale = await prisma.$queryRaw<
      Array<{ id: string; visitorId: string }>
    >`
      SELECT c.id, c."visitorId"
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
      if (!purgedVisitors.has(row.visitorId)) {
        purgedVisitors.add(row.visitorId);
        await purgeVisitorMemory(row.visitorId);
      }
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
