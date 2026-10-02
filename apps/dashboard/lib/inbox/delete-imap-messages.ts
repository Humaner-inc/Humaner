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

type SpecialUse =
  | '\\Inbox'
  | '\\Trash'
  | '\\Junk'
  | '\\Archive'
  | '\\Sent'
  | '\\Drafts';

function formatMessageIdHeader(value: string): string {
  const bare = value.trim().replace(/^<|>$/g, '');
  return `<${bare}>`;
}

async function withImapClient(
  connection: ConnectionForDelete,
  run: (client: import('imapflow').ImapFlow) => Promise<void>
): Promise<void> {
  const imapHost = decryptSensitiveField(connection.imapHost);
  const imapUser = decryptSensitiveField(connection.imapUser);
  const imapPassword = decryptSensitiveField(connection.imapPassword);
  const smtpHost = decryptSensitiveField(connection.smtpHost);

  if (
    !imapHost ||
    !imapUser ||
    !imapPassword ||
    !connection.imapPort ||
    !smtpHost ||
    !connection.smtpPort
  ) {
    throw new Error('Mailbox connection is missing encrypted IMAP settings.');
  }

  const validatedHosts = await validateMailEndpoints({
    imapHost,
    imapPort: connection.imapPort,
    smtpHost,
    smtpPort: connection.smtpPort
  });

  const { ImapFlow } = await import('imapflow');
  const client = new ImapFlow({
    host: validatedHosts.imap.address,
    servername: validatedHosts.imap.hostname,
    port: connection.imapPort,
    secure: connection.imapTls,
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
    await run(client);
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
      await markMailboxNeedsReauth(connection.id, message);
    } else {
      await prisma.mailboxConnection.update({
        where: { id: connection.id },
        data: { lastError: message.slice(0, 2000) }
      });
    }
    throw error;
  }
}

async function collectUidsInOpenMailbox(
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

async function resolveMailboxPaths(
  client: import('imapflow').ImapFlow
): Promise<string[]> {
  const mailboxes = await client.list();
  const paths = new Set<string>(['INBOX']);
  const preferred: SpecialUse[] = [
    '\\Inbox',
    '\\Trash',
    '\\Junk',
    '\\Sent',
    '\\Archive',
    '\\Drafts'
  ];

  for (const use of preferred) {
    const box = mailboxes.find((entry) => entry.specialUse === use);
    if (box?.path) paths.add(box.path);
  }

  for (const box of mailboxes) {
    if (/junk|spam|trash|deleted|archive|sent|draft/i.test(box.path)) {
      paths.add(box.path);
    }
  }

  return [...paths];
}

/**
 * Moves matching INBOX messages to Trash (or expunges if no Trash mailbox).
 * Used when Humaner soft-deletes into Trash. Missing messages are ignored.
 */
export async function deleteImapInboxMessages(input: {
  connection: ConnectionForDelete;
  providerMessageIds: string[];
}): Promise<void> {
  const ids = [
    ...new Set(input.providerMessageIds.map((id) => id.trim()).filter(Boolean))
  ];
  if (ids.length === 0) return;

  await withImapClient(input.connection, async (client) => {
    const mailboxes = await client.list();
    const trash = mailboxes.find((box) => box.specialUse === '\\Trash');
    const trashPath = trash?.path ?? null;
    const lock = await client.getMailboxLock('INBOX');

    try {
      const uids = await collectUidsInOpenMailbox(
        client,
        input.connection.id,
        ids
      );
      if (uids.length === 0) return;

      if (trashPath) {
        await client.messageMove(uids, trashPath, { uid: true });
      } else {
        await client.messageDelete(uids, { uid: true });
      }
    } finally {
      lock.release();
    }
  });
}

/**
 * Permanently removes messages from the IMAP server (expunge), searching
 * Inbox / Trash / Spam / Sent / Archive — not Inbox-only.
 */
export async function permanentlyDeleteImapMessages(input: {
  connection: ConnectionForDelete;
  providerMessageIds: string[];
}): Promise<void> {
  const ids = [
    ...new Set(input.providerMessageIds.map((id) => id.trim()).filter(Boolean))
  ];
  if (ids.length === 0) return;

  await withImapClient(input.connection, async (client) => {
    const paths = await resolveMailboxPaths(client);

    for (const path of paths) {
      let lock;
      try {
        lock = await client.getMailboxLock(path);
      } catch {
        continue;
      }

      try {
        const uids = await collectUidsInOpenMailbox(
          client,
          input.connection.id,
          ids
        );
        if (uids.length === 0) continue;
        // Permanent delete + expunge on this mailbox.
        await client.messageDelete(uids, { uid: true });
      } finally {
        lock.release();
      }
    }
  });
}

/**
 * Soft-delete helper: move matching messages to Trash over IMAP.
 * Non-IMAP connections are skipped.
 */
export async function deleteImapMessagesForThreads(
  threadIds: string[],
  organizationId: string
): Promise<void> {
  if (threadIds.length === 0) return;

  const buckets = await loadImapBuckets(threadIds, organizationId);
  for (const bucket of buckets) {
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

/**
 * Permanent delete: expunge matching messages from IMAP across folders.
 */
export async function permanentlyDeleteImapMessagesForThreads(
  threadIds: string[],
  organizationId: string
): Promise<void> {
  if (threadIds.length === 0) return;

  const buckets = await loadImapBuckets(threadIds, organizationId);
  for (const bucket of buckets) {
    if (bucket.connection.status !== MailConnectionStatus.ACTIVE) {
      throw new Error(
        'Reconnect this mailbox before deleting messages from the provider.'
      );
    }
    await permanentlyDeleteImapMessages({
      connection: bucket.connection,
      providerMessageIds: [...bucket.providerMessageIds]
    });
  }
}

async function loadImapBuckets(
  threadIds: string[],
  organizationId: string
): Promise<
  Array<{
    connection: ConnectionForDelete & {
      provider: MailProvider;
      status: MailConnectionStatus;
    };
    providerMessageIds: Set<string>;
  }>
> {
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

  return [...byConnection.values()];
}
