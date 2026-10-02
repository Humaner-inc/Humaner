import 'server-only';

import { MailProvider, MailThreadFolder } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { deleteImapMessagesForThreads } from '@/lib/inbox/delete-imap-messages';
import { deleteGmailThread } from '@/lib/inbox/gmail/api';
import { getGmailAccessToken } from '@/lib/inbox/gmail/tokens';

const BATCH_SIZE = 50;
const SYNTHETIC_THREAD_RE = /^(outbound-|draft-)/i;

async function deleteGmailThreadsForThreads(
  threadIds: string[],
  organizationId: string
): Promise<void> {
  if (threadIds.length === 0) return;

  const threads = await prisma.mailThread.findMany({
    where: { id: { in: threadIds }, organizationId },
    select: {
      providerThreadId: true,
      alias: {
        select: {
          connection: {
            select: {
              id: true,
              provider: true
            }
          }
        }
      }
    }
  });

  const byConnection = new Map<string, string[]>();
  for (const thread of threads) {
    if (thread.alias.connection.provider !== MailProvider.GMAIL) continue;
    if (SYNTHETIC_THREAD_RE.test(thread.providerThreadId)) continue;
    const list = byConnection.get(thread.alias.connection.id) ?? [];
    list.push(thread.providerThreadId);
    byConnection.set(thread.alias.connection.id, list);
  }

  for (const [connectionId, providerThreadIds] of byConnection) {
    const accessToken = await getGmailAccessToken(connectionId);
    for (const providerThreadId of [...new Set(providerThreadIds)]) {
      await deleteGmailThread(accessToken, providerThreadId);
    }
  }
}

export async function permanentlyDeleteMailThreads(
  threadIds: string[],
  organizationId: string
): Promise<number> {
  if (threadIds.length === 0) return 0;

  await Promise.all([
    deleteImapMessagesForThreads(threadIds, organizationId),
    deleteGmailThreadsForThreads(threadIds, organizationId)
  ]);

  const threads = await prisma.mailThread.findMany({
    where: { id: { in: threadIds }, organizationId },
    select: { id: true }
  });
  for (const thread of threads) {
    await prisma.mailThread.delete({ where: { id: thread.id } });
  }

  return threads.length;
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
