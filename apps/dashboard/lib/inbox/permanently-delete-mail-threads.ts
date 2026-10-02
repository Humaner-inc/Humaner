import 'server-only';

import {
  MailConnectionStatus,
  MailProvider,
  MailThreadFolder
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { permanentlyDeleteImapMessagesForThreads } from '@/lib/inbox/delete-imap-messages';
import { isInsufficientScopeErrorMessage } from '@/lib/inbox/gmail-sync-errors';
import { deleteGmailThread } from '@/lib/inbox/gmail/api';
import {
  GMAIL_FULL_MAIL_SCOPE_HINT,
  hasGmailFullMailScope
} from '@/lib/inbox/gmail/oauth';
import { getGmailAccessToken } from '@/lib/inbox/gmail/tokens';

const BATCH_SIZE = 50;
const SYNTHETIC_THREAD_RE = /^(outbound-|draft-)/i;

/**
 * Permanently delete threads on Gmail (`users.threads.delete`).
 * Requires `https://mail.google.com/` — reconnect if missing.
 */
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
              provider: true,
              scopes: true,
              status: true
            }
          }
        }
      }
    }
  });

  const byConnection = new Map<
    string,
    { scopes: string | null; status: MailConnectionStatus; ids: string[] }
  >();

  for (const thread of threads) {
    if (thread.alias.connection.provider !== MailProvider.GMAIL) continue;
    if (SYNTHETIC_THREAD_RE.test(thread.providerThreadId)) continue;
    const connectionId = thread.alias.connection.id;
    let bucket = byConnection.get(connectionId);
    if (!bucket) {
      bucket = {
        scopes: thread.alias.connection.scopes,
        status: thread.alias.connection.status,
        ids: []
      };
      byConnection.set(connectionId, bucket);
    }
    bucket.ids.push(thread.providerThreadId);
  }

  for (const [connectionId, bucket] of byConnection) {
    if (bucket.status !== MailConnectionStatus.ACTIVE) {
      throw new Error(
        'Reconnect this mailbox before deleting messages from Gmail.'
      );
    }

    if (!hasGmailFullMailScope(bucket.scopes)) {
      await prisma.mailboxConnection.update({
        where: { id: connectionId },
        data: {
          status: MailConnectionStatus.NEEDS_REAUTH,
          lastError: GMAIL_FULL_MAIL_SCOPE_HINT
        }
      });
      throw new Error(GMAIL_FULL_MAIL_SCOPE_HINT);
    }

    const accessToken = await getGmailAccessToken(connectionId);
    for (const providerThreadId of [...new Set(bucket.ids)]) {
      try {
        await deleteGmailThread(accessToken, providerThreadId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Gmail delete failed';
        if (isInsufficientScopeErrorMessage(message)) {
          await prisma.mailboxConnection.update({
            where: { id: connectionId },
            data: {
              status: MailConnectionStatus.NEEDS_REAUTH,
              lastError: GMAIL_FULL_MAIL_SCOPE_HINT
            }
          });
          throw new Error(GMAIL_FULL_MAIL_SCOPE_HINT);
        }
        if (/notFound|404/i.test(message)) {
          continue;
        }
        throw error;
      }
    }
  }
}

export async function permanentlyDeleteMailThreads(
  threadIds: string[],
  organizationId: string
): Promise<number> {
  if (threadIds.length === 0) return 0;

  // Provider first — only remove Humaner rows after remote delete succeeds.
  await permanentlyDeleteImapMessagesForThreads(threadIds, organizationId);
  await deleteGmailThreadsForThreads(threadIds, organizationId);

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
