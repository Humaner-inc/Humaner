import 'server-only';

import { MailThreadFolder } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { deleteImapMessagesForThreads } from '@/lib/inbox/delete-imap-messages';

const BATCH_SIZE = 50;

export async function permanentlyDeleteMailThreads(
  threadIds: string[],
  organizationId: string
): Promise<number> {
  if (threadIds.length === 0) return 0;

  await deleteImapMessagesForThreads(threadIds, organizationId);

  const deleted = await prisma.mailThread.deleteMany({
    where: { id: { in: threadIds }, organizationId }
  });

  return deleted.count;
}

export async function listTrashThreadIds(input: {
  accessWhere: {
    organizationId: string;
    OR?: Array<{ aliasId: { in: string[] } } | { assigneeId: string }>;
  };
  connectionId?: string | null;
  take?: number;
}): Promise<string[]> {
  const threads = await prisma.mailThread.findMany({
    where: {
      ...input.accessWhere,
      folder: MailThreadFolder.TRASH,
      ...(input.connectionId
        ? { alias: { connectionId: input.connectionId } }
        : {})
    },
    take: input.take ?? BATCH_SIZE,
    select: { id: true }
  });

  return threads.map((thread) => thread.id);
}

export { BATCH_SIZE as TRASH_DELETE_BATCH_SIZE };
