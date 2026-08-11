import 'server-only';

import {
  isImapAuthError,
  markMailboxNeedsReauth
} from '@/services/inbox/sync-imap-mailboxes';
import { MailConnectionStatus, MailProvider } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

const FALLBACK_UID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(\d+)$/i;

type ConnectionForDelete = {
  id: string;
  email: string;
  imapHost: string | null;
  imapPort: number | null;
  imapUser: string | null;
  imapPassword: string | null;
  imapTls: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
};

function formatMessageIdHeader(value: string): string {
  const bare = value.trim().replace(/^<|>$/g, '');
  return `<${bare}>`;
}

async function resolveTrashPath(
  client: import('imapflow').ImapFlow
): Promise<string | null> {
  const mailboxes = await client.list();
  const trash = mailboxes.find((box) => box.specialUse === '\\Trash');
  return trash?.path ?? null;
}

async function removeUidsFromMailbox(
  client: import('imapflow').ImapFlow,
  uids: number[],
  trashPath: string | null
): Promise<void> {
  if (uids.length === 0) return;

  if (trashPath) {
    await client.messageMove(uids, trashPath, { uid: true });
    return;
  }

  await client.messageDelete(uids, { uid: true });
}

async function collectUidsForMessageIds(
  client: import('imapflow').ImapFlow,
  connectionId: string,
  providerMessageIds: string[]
): Promise<number[]> {
  const uidSet = new Set<number>();

  for (const providerMessageId of providerMessageIds) {
    const fallback = FALLBACK_UID_RE.exec(providerMessageId);
    if (fallback && fallback[1].toLowerCase() === connectionId.toLowerCase()) {
      uidSet.add(Number(fallback[2]));
      continue;
    }

    const bracketed = formatMessageIdHeader(providerMessageId);
    let found = await client.search(
      { header: { 'message-id': bracketed } },
      { uid: true }
    );

    if ((!found || found.length === 0) && providerMessageId) {
      found = await client.search(
        { header: { 'message-id': providerMessageId } },
        { uid: true }
      );
    }

    if (found) {
      for (const uid of found) uidSet.add(uid);
    }
  }

  return [...uidSet];
}

/**
 * Moves matching INBOX messages to Trash (or expunges if no Trash mailbox).
 * Missing messages are treated as already gone.
 */
export async function deleteImapInboxMessages(input: {
  connection: ConnectionForDelete;
  providerMessageIds: string[];
}): Promise<void> {
  const ids = [
    ...new Set(input.providerMessageIds.map((id) => id.trim()).filter(Boolean))
  ];
  if (ids.length === 0) return;

  const imapHost = decryptSensitiveField(input.connection.imapHost);
  const imapUser = decryptSensitiveField(input.connection.imapUser);
  const imapPassword = decryptSensitiveField(input.connection.imapPassword);
  const smtpHost = decryptSensitiveField(input.connection.smtpHost);

  if (
    !imapHost ||
    !imapUser ||
    !imapPassword ||
    !input.connection.imapPort ||
    !smtpHost ||
    !input.connection.smtpPort
  ) {
    throw new Error('Mailbox connection is missing encrypted IMAP settings.');
  }

  const validatedHosts = await validateMailEndpoints({
    imapHost,
    imapPort: input.connection.imapPort,
    smtpHost,
    smtpPort: input.connection.smtpPort
  });

  const { ImapFlow } = await import('imapflow');
  const client = new ImapFlow({
    host: validatedHosts.imap.address,
    servername: validatedHosts.imap.hostname,
    port: input.connection.imapPort,
    secure: input.connection.imapTls,
    auth: { user: imapUser, pass: imapPassword },
    logger: false,
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000
  });

  try {
    await client.connect();
    const trashPath = await resolveTrashPath(client);
    const lock = await client.getMailboxLock('INBOX');

    try {
      const uids = await collectUidsForMessageIds(
        client,
        input.connection.id,
        ids
      );
      await removeUidsFromMailbox(client, uids, trashPath);
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    try {
      await client.close();
    } catch {
      // Ignore cleanup errors.
    }

    const message =
      error instanceof Error ? error.message : 'Mailbox delete failed';
    if (isImapAuthError(error)) {
      await markMailboxNeedsReauth(input.connection.id, message);
    } else {
      await prisma.mailboxConnection.update({
        where: { id: input.connection.id },
        data: { lastError: message.slice(0, 2000) }
      });
    }
    throw error;
  }
}

/**
 * Deletes matching provider messages over IMAP for the given threads, grouped
 * by mailbox connection. Non-IMAP connections are skipped.
 */
export async function deleteImapMessagesForThreads(
  threadIds: string[],
  organizationId: string
): Promise<void> {
  if (threadIds.length === 0) return;

  const threads = await prisma.mailThread.findMany({
    where: { id: { in: threadIds }, organizationId },
    select: {
      id: true,
      messages: { select: { providerMessageId: true } },
      alias: {
        select: {
          connection: {
            select: {
              id: true,
              provider: true,
              status: true,
              email: true,
              imapHost: true,
              imapPort: true,
              imapUser: true,
              imapPassword: true,
              imapTls: true,
              smtpHost: true,
              smtpPort: true
            }
          }
        }
      }
    }
  });

  const byConnection = new Map<
    string,
    {
      connection: ConnectionForDelete & {
        provider: MailProvider;
        status: MailConnectionStatus;
      };
      providerMessageIds: Set<string>;
    }
  >();

  for (const thread of threads) {
    const connection = thread.alias.connection;
    if (connection.provider !== MailProvider.IMAP) continue;

    let bucket = byConnection.get(connection.id);
    if (!bucket) {
      bucket = {
        connection,
        providerMessageIds: new Set()
      };
      byConnection.set(connection.id, bucket);
    }

    for (const message of thread.messages) {
      if (message.providerMessageId) {
        bucket.providerMessageIds.add(message.providerMessageId);
      }
    }
  }

  for (const bucket of byConnection.values()) {
    if (bucket.connection.status !== MailConnectionStatus.ACTIVE) {
      throw new Error(
        'Reconnect this mailbox before deleting messages from the provider.'
      );
    }

    await deleteImapInboxMessages({
      connection: bucket.connection,
      providerMessageIds: [...bucket.providerMessageIds]
    });
  }
}
