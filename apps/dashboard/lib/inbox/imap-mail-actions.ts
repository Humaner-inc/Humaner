import 'server-only';

import {
  isImapAuthError,
  markMailboxNeedsReauth
} from '@/services/inbox/sync-imap-mailboxes';
import { MailConnectionStatus, MailProvider } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

export type ImapProviderMailAction =
  | 'archive'
  | 'unarchive'
  | 'trash'
  | 'spam'
  | 'inbox'
  | 'read'
  | 'unread';

const FALLBACK_UID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(\d+)$/i;

type ImapConnectionCreds = {
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

type SpecialUse =
  | '\\Inbox'
  | '\\Trash'
  | '\\Junk'
  | '\\Archive'
  | '\\Sent'
  | '\\Drafts';

async function resolveSpecialUsePaths(
  client: import('imapflow').ImapFlow
): Promise<Map<SpecialUse, string>> {
  const mailboxes = await client.list();
  const paths = new Map<SpecialUse, string>();
  for (const box of mailboxes) {
    const use = box.specialUse as SpecialUse | undefined;
    if (!use || paths.has(use)) continue;
    paths.set(use, box.path);
  }
  if (!paths.has('\\Inbox')) {
    paths.set('\\Inbox', 'INBOX');
  }
  return paths;
}

async function collectUidsInMailbox(
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

function targetSpecialUse(action: ImapProviderMailAction): SpecialUse | null {
  switch (action) {
    case 'archive':
      return '\\Archive';
    case 'unarchive':
    case 'inbox':
      return '\\Inbox';
    case 'trash':
      return '\\Trash';
    case 'spam':
      return '\\Junk';
    default:
      return null;
  }
}

async function withImapClient<T>(
  connection: ImapConnectionCreds,
  run: (client: import('imapflow').ImapFlow) => Promise<T>
): Promise<T> {
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
    const result = await run(client);
    await client.logout();
    return result;
  } catch (error) {
    try {
      await client.close();
    } catch {
      // Ignore cleanup errors.
    }

    const message =
      error instanceof Error ? error.message : 'IMAP mailbox action failed';
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

/**
 * Apply archive / folder / read state on an IMAP mailbox for the given
 * provider message ids (searched across common folders).
 */
export async function applyImapMailAction(input: {
  connection: ImapConnectionCreds;
  providerMessageIds: string[];
  action: ImapProviderMailAction;
}): Promise<void> {
  const ids = [
    ...new Set(input.providerMessageIds.map((id) => id.trim()).filter(Boolean))
  ];
  if (ids.length === 0) return;

  await withImapClient(input.connection, async (client) => {
    const paths = await resolveSpecialUsePaths(client);
    const searchOrder: SpecialUse[] = [
      '\\Inbox',
      '\\Sent',
      '\\Archive',
      '\\Junk',
      '\\Trash',
      '\\Drafts'
    ];

    const found: Array<{ path: string; uids: number[] }> = [];
    for (const use of searchOrder) {
      const path = paths.get(use);
      if (!path) continue;
      let lock;
      try {
        lock = await client.getMailboxLock(path);
      } catch {
        continue;
      }
      try {
        const uids = await collectUidsInMailbox(
          client,
          input.connection.id,
          ids
        );
        if (uids.length > 0) {
          found.push({ path, uids });
        }
      } finally {
        lock.release();
      }
    }

    if (found.length === 0) {
      // Read/unread is best-effort; folder moves must not soft-succeed locally.
      if (input.action === 'read' || input.action === 'unread') {
        return;
      }
      throw new Error(
        'Could not find these messages on the IMAP mailbox to sync the action.'
      );
    }

    if (input.action === 'read' || input.action === 'unread') {
      for (const entry of found) {
        const lock = await client.getMailboxLock(entry.path);
        try {
          if (input.action === 'read') {
            await client.messageFlagsAdd(entry.uids, ['\\Seen'], { uid: true });
          } else {
            await client.messageFlagsRemove(entry.uids, ['\\Seen'], {
              uid: true
            });
          }
        } finally {
          lock.release();
        }
      }
      return;
    }

    const targetUse = targetSpecialUse(input.action);
    if (!targetUse) return;

    let destination = paths.get(targetUse) ?? null;

    // Gmail IMAP: archive = move to All Mail (no \Archive). Prefer path names.
    if (!destination && input.action === 'archive') {
      const mailboxes = await client.list();
      const allMail = mailboxes.find(
        (box) =>
          /all mail/i.test(box.path) ||
          box.specialUse === '\\All' ||
          box.specialUse === '\\Archive'
      );
      destination = allMail?.path ?? null;
    }

    if (!destination && input.action === 'spam') {
      const mailboxes = await client.list();
      const junk = mailboxes.find(
        (box) => box.specialUse === '\\Junk' || /junk|spam/i.test(box.path)
      );
      destination = junk?.path ?? null;
    }

    if (!destination) {
      throw new Error(
        `IMAP mailbox has no ${targetUse.replace('\\', '')} folder to sync this action.`
      );
    }

    for (const entry of found) {
      if (entry.path === destination) continue;
      const lock = await client.getMailboxLock(entry.path);
      try {
        await client.messageMove(entry.uids, destination, { uid: true });
      } finally {
        lock.release();
      }
    }
  });
}

export async function applyImapMailActionForThread(input: {
  threadId: string;
  organizationId: string;
  action: ImapProviderMailAction;
}): Promise<void> {
  const thread = await prisma.mailThread.findFirst({
    where: { id: input.threadId, organizationId: input.organizationId },
    select: {
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

  if (!thread) return;
  const connection = thread.alias.connection;
  if (connection.provider !== MailProvider.IMAP) return;
  if (connection.status !== MailConnectionStatus.ACTIVE) {
    throw new Error(
      'Reconnect this mailbox before syncing actions to the provider.'
    );
  }

  const providerMessageIds = thread.messages
    .map((message) => message.providerMessageId)
    .filter(Boolean);

  await applyImapMailAction({
    connection,
    providerMessageIds,
    action: input.action
  });
}
