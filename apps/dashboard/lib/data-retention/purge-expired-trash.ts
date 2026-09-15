import 'server-only';

import { MailThreadFolder, type MailTrashRetention } from '@prisma/client';
import { subDays } from 'date-fns';

import { prisma } from '@/lib/db/prisma';
import {
  MAIL_TRASH_RETENTIONS,
  mailTrashRetentionDays
} from '@/lib/inbox/mail-trash-retention';
import { permanentlyDeleteMailThreads } from '@/lib/inbox/permanently-delete-mail-threads';

const BATCH_SIZE = 50;
const MAX_BATCHES_PER_RUN = 200;

export type PurgeExpiredTrashResult = {
  threadsDeleted: number;
};

export async function purgeExpiredTrash(): Promise<PurgeExpiredTrashResult> {
  const now = new Date();
  let threadsDeleted = 0;

  for (const retention of MAIL_TRASH_RETENTIONS) {
    const cutoff = subDays(now, mailTrashRetentionDays(retention));

    for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
      const stale = await prisma.mailThread.findMany({
        where: {
          folder: MailThreadFolder.TRASH,
          trashedAt: { lt: cutoff },
          organization: {
            trashRetention: retention as MailTrashRetention
          }
        },
        take: BATCH_SIZE,
        select: { id: true, organizationId: true }
      });

      if (stale.length === 0) break;

      const byOrg = new Map<string, string[]>();
      for (const thread of stale) {
        const ids = byOrg.get(thread.organizationId);
        if (ids) {
          ids.push(thread.id);
        } else {
          byOrg.set(thread.organizationId, [thread.id]);
        }
      }

      let batchFailed = false;
      for (const [organizationId, threadIds] of byOrg) {
        try {
          threadsDeleted += await permanentlyDeleteMailThreads(
            threadIds,
            organizationId
          );
        } catch {
          batchFailed = true;
        }
      }

      if (batchFailed || stale.length < BATCH_SIZE) break;
    }
  }

  return { threadsDeleted };
}
