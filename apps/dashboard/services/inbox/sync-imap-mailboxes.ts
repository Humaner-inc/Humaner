import 'server-only';

import {
  MailConnectionStatus,
  MailMessageDirection,
  MailProvider,
  MailThreadFolder,
  type Prisma
} from '@prisma/client';
import { simpleParser, type AddressObject, type ParsedMail } from 'mailparser';

import { prisma } from '@/lib/db/prisma';
import { loadBlockedSenderSet } from '@/lib/inbox/mail-thread-folder';
import { resolveStoredMailBodies } from '@/lib/inbox/sanitize-mail-html';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

/**
 * IMAP sync (poll) + shared helpers for the IMAP IDLE worker.
 *
 * Near-realtime path: `pnpm imap:idle` → `services/inbox/imap-idle-worker.ts`
 * (requires `IMAP_IDLE_ENABLED=true` on a long-lived host — not Vercel).
 *
 * Fallback: `/api/cron/sync-imap-mailboxes` + manual Sync remain catch-up.
 *
 * Env for IDLE worker:
 * - `IMAP_IDLE_ENABLED=true`
 * - `IMAP_IDLE_MAX_CONNECTIONS` (default 50)
 * - `IMAP_IDLE_RECONNECT_MS` (default 5000)
 * - `IMAP_IDLE_ROSTER_REFRESH_MS` (default 60000)
 */

const CONNECTIONS_PER_RUN = 10;
const MESSAGES_PER_CONNECTION = 100;
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;

const connectionSelect = {
  id: true,
  organizationId: true,
  email: true,
  imapHost: true,
  imapPort: true,
  imapUser: true,
  imapPassword: true,
  imapTls: true,
  smtpHost: true,
  smtpPort: true,
  aliases: {
    where: { enabled: true },
    select: { id: true, address: true }
  }
} satisfies Prisma.MailboxConnectionSelect;

type SyncableConnection = Prisma.MailboxConnectionGetPayload<{
  select: typeof connectionSelect;
}>;

type ParsedSyncMessage = {
  aliasId: string;
  providerThreadId: string;
  providerMessageId: string;
  direction: MailMessageDirection;
  subject: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  bodyText: string | null;
  bodyHtml: string | null;
  sentAt: Date;
  folder: MailThreadFolder;
  archivedAt: Date | null;
  trashedAt: Date | null;
  isUnread: boolean;
};

type ImapSyncFolder = {
  path: string;
  folder: MailThreadFolder;
  archivedAt: Date | null;
  trashedAt: Date | null;
};

export type ImapSyncResult = {
  connections: number;
  messages: number;
  errors: number;
};

export function isImapAuthError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return (
    message.includes('authentication') ||
    message.includes('auth failed') ||
    message.includes('authenticationfailed') ||
    message.includes('invalid credentials') ||
    message.includes('invalid login') ||
    message.includes('login failed') ||
    message.includes('too many login') ||
    message.includes('application-specific password')
  );
}

export async function markMailboxNeedsReauth(
  connectionId: string,
  lastError: string
): Promise<void> {
  await prisma.mailboxConnection.update({
    where: { id: connectionId },
    data: {
      status: MailConnectionStatus.NEEDS_REAUTH,
      lastError: lastError.slice(0, 2000)
    }
  });
}

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeMessageId(value: string): string {
  return value.trim().replace(/^<|>$/g, '').toLowerCase().slice(0, 512);
}

function addressObjectValues(
  value: AddressObject | AddressObject[] | undefined
): string[] {
  const objects = Array.isArray(value) ? value : value ? [value] : [];
  const addresses = new Set<string>();

  for (const object of objects) {
    for (const entry of object.value) {
      if (entry.address) addresses.add(normalizeAddress(entry.address));
    }
  }

  return [...addresses];
}

function headerAddresses(mail: ParsedMail): string[] {
  const addresses = new Set<string>();
  const headerNames = new Set([
    'delivered-to',
    'x-original-to',
    'x-envelope-to',
    'envelope-to',
    'x-forwarded-to'
  ]);

  for (const header of mail.headerLines) {
    if (!headerNames.has(header.key.toLowerCase())) continue;

    for (const match of header.line.matchAll(
      /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
    )) {
      addresses.add(normalizeAddress(match[0]));
    }
  }

  return [...addresses];
}

const MAX_INLINE_CID_BYTES = 750_000;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Rewrite cid: images to data URIs so logos/embeds survive sanitize + iframe. */
function inlineCidImages(html: string, mail: ParsedMail): string {
  const attachments = mail.attachments ?? [];
  if (attachments.length === 0) return html;

  let next = html;
  for (const attachment of attachments) {
    const rawCid = attachment.contentId?.trim();
    if (!rawCid || !attachment.content?.length) continue;
    if (attachment.content.length > MAX_INLINE_CID_BYTES) continue;

    const cid = rawCid.replace(/^<|>$/g, '');
    if (!cid) continue;

    const mime =
      attachment.contentType?.split(';')[0]?.trim() ||
      'application/octet-stream';
    if (!mime.startsWith('image/')) continue;

    const dataUri = `data:${mime};base64,${attachment.content.toString('base64')}`;
    next = next.replace(
      new RegExp(`(?:cid:)${escapeRegExp(cid)}`, 'gi'),
      dataUri
    );
  }

  return next;
}

function threadIdForMail(mail: ParsedMail, fallback: string): string {
  const references = Array.isArray(mail.references)
    ? mail.references
    : mail.references
      ? [mail.references]
      : [];
  const root = references[0] ?? mail.inReplyTo ?? mail.messageId ?? fallback;
  return normalizeMessageId(root);
}

function parseForSync(
  mail: ParsedMail,
  connection: SyncableConnection,
  fallbackId: string,
  folderMeta: Omit<ImapSyncFolder, 'path'>,
  flags: string[] | undefined
): ParsedSyncMessage | null {
  const toAddresses = addressObjectValues(mail.to);
  const ccAddresses = addressObjectValues(mail.cc);
  const recipientAddresses = new Set([
    ...toAddresses,
    ...ccAddresses,
    ...headerAddresses(mail)
  ]);
  const fromAddress = addressObjectValues(mail.from)[0];
  if (!fromAddress) return null;

  const aliasAddresses = new Set(
    connection.aliases.map((item) => normalizeAddress(item.address))
  );

  const alias =
    connection.aliases.find((item) =>
      recipientAddresses.has(normalizeAddress(item.address))
    ) ??
    connection.aliases.find(
      (item) => normalizeAddress(item.address) === fromAddress
    );

  if (!alias) return null;

  const providerMessageId = normalizeMessageId(mail.messageId ?? fallbackId);
  if (!providerMessageId) return null;

  const rawHtml =
    typeof mail.html === 'string' && mail.html.trim() ? mail.html : null;
  const bodies = resolveStoredMailBodies({
    html: rawHtml ? inlineCidImages(rawHtml, mail) : null,
    text: mail.text ?? null
  });

  const seen = (flags ?? []).some((flag) => flag.toLowerCase() === '\\seen');

  return {
    aliasId: alias.id,
    providerThreadId: threadIdForMail(mail, fallbackId),
    providerMessageId,
    direction: aliasAddresses.has(fromAddress)
      ? MailMessageDirection.OUTBOUND
      : MailMessageDirection.INBOUND,
    subject: (mail.subject?.trim() || '(No subject)').slice(0, 998),
    fromAddress: fromAddress.slice(0, 255),
    toAddresses,
    ccAddresses,
    bodyText: bodies.bodyText,
    bodyHtml: bodies.bodyHtml,
    sentAt: mail.date ?? new Date(),
    folder: folderMeta.folder,
    archivedAt: folderMeta.archivedAt,
    trashedAt: folderMeta.trashedAt,
    isUnread: !seen
  };
}

async function persistMessages(
  connection: SyncableConnection,
  messages: ParsedSyncMessage[]
): Promise<number> {
  let imported = 0;
  const blocked = await loadBlockedSenderSet(connection.organizationId);

  for (const message of messages) {
    let importedInboundThreadId: string | null = null;
    await prisma.$transaction(async (tx) => {
      const isInbound = message.direction === MailMessageDirection.INBOUND;

      let folder = message.folder;
      const archivedAt = message.archivedAt;
      const trashedAt = message.trashedAt;
      if (
        isInbound &&
        folder === MailThreadFolder.INBOX &&
        !archivedAt &&
        blocked.has(normalizeAddress(message.fromAddress))
      ) {
        folder = MailThreadFolder.SPAM;
      }

      // Upsert must not rewind lastMessageAt or re-flag read threads as unread
      // when IMAP re-delivers older messages after a reply.
      const thread = await tx.mailThread.upsert({
        where: {
          aliasId_providerThreadId: {
            aliasId: message.aliasId,
            providerThreadId: message.providerThreadId
          }
        },
        create: {
          organizationId: connection.organizationId,
          aliasId: message.aliasId,
          providerThreadId: message.providerThreadId,
          subject: message.subject,
          lastMessageAt: message.sentAt,
          isUnread: isInbound ? message.isUnread : false,
          folder,
          archivedAt,
          trashedAt
        },
        update: {
          subject: message.subject,
          folder,
          archivedAt,
          trashedAt,
          isUnread: message.isUnread
        },
        select: { id: true, lastMessageAt: true, folder: true }
      });

      const existing = await tx.mailMessage.findUnique({
        where: {
          threadId_providerMessageId: {
            threadId: thread.id,
            providerMessageId: message.providerMessageId
          }
        },
        select: { id: true, bodyHtml: true, bodyText: true }
      });

      if (!existing) {
        await tx.mailMessage.create({
          data: {
            threadId: thread.id,
            providerMessageId: message.providerMessageId,
            direction: message.direction,
            fromAddress: message.fromAddress,
            toAddresses: message.toAddresses,
            ccAddresses: message.ccAddresses,
            bodyText: message.bodyText,
            bodyHtml: message.bodyHtml,
            sentAt: message.sentAt
          }
        });
        if (isInbound) {
          importedInboundThreadId = thread.id;
        }

        const newerThanThread = message.sentAt > thread.lastMessageAt;
        await tx.mailThread.update({
          where: { id: thread.id },
          data: {
            ...(newerThanThread ? { lastMessageAt: message.sentAt } : {}),
            folder,
            archivedAt,
            trashedAt,
            isUnread: isInbound ? message.isUnread : false
          }
        });
      } else {
        // Refresh bodies when re-fetched so sanitizer/layout improvements apply
        // to already-imported messages (idempotent; no unread side effects).
        if (
          existing.bodyHtml !== message.bodyHtml ||
          existing.bodyText !== message.bodyText
        ) {
          await tx.mailMessage.update({
            where: { id: existing.id },
            data: {
              bodyText: message.bodyText,
              bodyHtml: message.bodyHtml
            }
          });
        }

        if (message.sentAt > thread.lastMessageAt) {
          await tx.mailThread.update({
            where: { id: thread.id },
            data: { lastMessageAt: message.sentAt }
          });
        }
      }
    });
    imported += 1;
    if (importedInboundThreadId) {
      const { applyCompanionAliasPolicyOnInbound } = await import(
        '@/lib/inbox/mail-assignee'
      );
      await applyCompanionAliasPolicyOnInbound({
        organizationId: connection.organizationId,
        threadId: importedInboundThreadId,
        aliasId: message.aliasId
      });
      const { scheduleMailCalendarIngest } = await import(
        '@/services/calendar/ingest-mail-for-calendar'
      );
      scheduleMailCalendarIngest({
        organizationId: connection.organizationId,
        threadId: importedInboundThreadId,
        subject: message.subject,
        bodyText: message.bodyText,
        bodyHtml: message.bodyHtml,
        sentAt: message.sentAt
      });
    }
  }

  return imported;
}

export async function syncImapConnection(
  connectionId: string
): Promise<number> {
  const connection = await prisma.mailboxConnection.findFirst({
    where: {
      id: connectionId,
      provider: MailProvider.IMAP,
      status: MailConnectionStatus.ACTIVE
    },
    select: connectionSelect
  });

  if (!connection || connection.aliases.length === 0) return 0;

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
    const mailboxes = await client.list();
    const now = new Date();
    const syncFolders: ImapSyncFolder[] = [];

    const pushUnique = (folder: ImapSyncFolder) => {
      if (syncFolders.some((entry) => entry.path === folder.path)) return;
      syncFolders.push(folder);
    };

    pushUnique({
      path: 'INBOX',
      folder: MailThreadFolder.INBOX,
      archivedAt: null,
      trashedAt: null
    });

    for (const box of mailboxes) {
      if (
        box.specialUse === '\\Junk' ||
        /(?:^|[/\s])(junk|spam)$/i.test(box.path)
      ) {
        pushUnique({
          path: box.path,
          folder: MailThreadFolder.SPAM,
          archivedAt: null,
          trashedAt: null
        });
      } else if (box.specialUse === '\\Trash') {
        pushUnique({
          path: box.path,
          folder: MailThreadFolder.TRASH,
          archivedAt: null,
          trashedAt: now
        });
      } else if (box.specialUse === '\\Sent') {
        pushUnique({
          path: box.path,
          folder: MailThreadFolder.SENT,
          archivedAt: null,
          trashedAt: null
        });
      } else if (box.specialUse === '\\Archive') {
        pushUnique({
          path: box.path,
          folder: MailThreadFolder.INBOX,
          archivedAt: now,
          trashedAt: null
        });
      }
    }

    const parsedMessages: ParsedSyncMessage[] = [];

    for (const syncFolder of syncFolders) {
      let lock;
      try {
        lock = await client.getMailboxLock(syncFolder.path);
      } catch {
        continue;
      }

      try {
        const mailbox = client.mailbox;
        const messageCount = mailbox === false ? 0 : (mailbox?.exists ?? 0);
        const start = Math.max(1, messageCount - MESSAGES_PER_CONNECTION + 1);

        if (messageCount > 0) {
          for await (const item of client.fetch(`${start}:*`, {
            uid: true,
            source: true,
            flags: true
          })) {
            if (!item.source || item.source.length > MAX_SOURCE_BYTES) continue;

            const fallbackId = `${connection.id}:${item.uid ?? item.seq}`;
            const parsed = parseForSync(
              await simpleParser(item.source),
              connection,
              fallbackId,
              {
                folder: syncFolder.folder,
                archivedAt: syncFolder.archivedAt,
                trashedAt: syncFolder.trashedAt
              },
              item.flags ? [...item.flags] : undefined
            );
            if (parsed) parsedMessages.push(parsed);
          }
        }
      } finally {
        lock.release();
      }
    }

    await client.logout();
    // Prefer authoritative folder: Trash > Spam > Inbox > Sent > Archive.
    const folderRank = (message: ParsedSyncMessage): number => {
      if (message.folder === MailThreadFolder.TRASH) return 5;
      if (message.folder === MailThreadFolder.SPAM) return 4;
      if (message.folder === MailThreadFolder.INBOX && !message.archivedAt)
        return 3;
      if (message.folder === MailThreadFolder.SENT) return 2;
      return 1;
    };
    const deduped = new Map<string, ParsedSyncMessage>();
    for (const message of parsedMessages) {
      const key = `${message.aliasId}:${message.providerMessageId}`;
      const existing = deduped.get(key);
      if (!existing || folderRank(message) >= folderRank(existing)) {
        deduped.set(key, message);
      }
    }
    const uniqueMessages = [...deduped.values()].sort(
      (left, right) => left.sentAt.getTime() - right.sentAt.getTime()
    );
    const imported = await persistMessages(connection, uniqueMessages);

    await prisma.mailboxConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        lastError: null
      }
    });

    return imported;
  } catch (error) {
    try {
      await client.close();
    } catch {
      // Ignore cleanup errors.
    }

    const message =
      error instanceof Error ? error.message : 'Mailbox synchronization failed';
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

export async function syncImapMailboxes(options?: {
  organizationId?: string;
  connectionId?: string;
  actorId?: string;
  actorName?: string;
}): Promise<ImapSyncResult> {
  const connections = await prisma.mailboxConnection.findMany({
    where: {
      provider: MailProvider.IMAP,
      status: MailConnectionStatus.ACTIVE,
      ...(options?.organizationId
        ? { organizationId: options.organizationId }
        : {}),
      ...(options?.connectionId ? { id: options.connectionId } : {})
    },
    orderBy: [{ lastSyncedAt: { sort: 'asc', nulls: 'first' } }],
    take: options?.connectionId ? 1 : CONNECTIONS_PER_RUN,
    select: { id: true, organizationId: true }
  });

  const result: ImapSyncResult = {
    connections: connections.length,
    messages: 0,
    errors: 0
  };
  const orgsWithMail = new Set<string>();

  for (const connection of connections) {
    try {
      const imported = await syncImapConnection(connection.id);
      result.messages += imported;
      if (imported > 0) {
        orgsWithMail.add(connection.organizationId);
      }
    } catch {
      result.errors += 1;
    }
  }

  for (const organizationId of orgsWithMail) {
    void publishOrgEvent(organizationId, {
      type: 'inbox.synced',
      actorId: options?.actorId,
      actorName: options?.actorName
    });
  }

  return result;
}
