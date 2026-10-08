import 'server-only';

import { randomUUID } from 'node:crypto';
import {
  fetchImapTextMessages,
  listEnvelopeMessageIds,
  listFlagChanges,
  listServerUids
} from '@/services/inbox/imap-folder-pass';
import {
  MailConnectionStatus,
  MailMessageDirection,
  MailProvider,
  MailThreadFolder,
  Prisma
} from '@prisma/client';
import { simpleParser, type AddressObject, type ParsedMail } from 'mailparser';

import { prisma } from '@/lib/db/prisma';
import {
  IMAP_BODY_TOO_LARGE_TEXT,
  type ImapAttachmentMeta
} from '@/lib/inbox/imap-body-parts';
import {
  imapFallbackMessageId,
  imapFolderUidPrefix,
  isLegacyUidFallback
} from '@/lib/inbox/imap-fallback-id';
import {
  tryImapMailboxLock,
  withImapMailboxLock
} from '@/lib/inbox/imap-mailbox-lock';
import {
  bootstrapSequencePages,
  expungedUids,
  IMAP_FETCH_PAGE,
  imapScopedThreadId,
  readModseq,
  storedUidsMatchServer
} from '@/lib/inbox/imap-sync-plan';
import {
  loadBlockedSenderSet,
  mailFolderPresenceRank,
  preferMailFolderState
} from '@/lib/inbox/mail-thread-folder';
import { resolveStoredMailBodies } from '@/lib/inbox/sanitize-mail-html';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

// incremental imap sync by uid, condstore, and text parts
const CONNECTIONS_PER_RUN = 10;
// first sync floor, validity reset pages back to the stored count
const MESSAGES_PER_CONNECTION = 100;
// mailboxes synced at once in one cron run
const IMAP_SYNC_CONCURRENCY = 3;

type ImapFolderCursor = {
  uidValidity: number;
  lastUid: number;
  // condstore highestmodseq when the server sends one
  highestModseq?: string;
};

type MailboxSyncCursor = {
  imapFolders?: Record<string, ImapFolderCursor>;
};

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
  syncCursor: true,
  aliases: {
    where: { enabled: true },
    select: { id: true, address: true }
  }
} satisfies Prisma.MailboxConnectionSelect;

function parseSyncCursor(value: unknown): MailboxSyncCursor {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as MailboxSyncCursor;
  if (!raw.imapFolders || typeof raw.imapFolders !== 'object') return {};
  return { imapFolders: raw.imapFolders };
}

async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]!);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => run()));
  return results;
}

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
  imapAttachments: ImapAttachmentMeta[];
  imapUid: number;
  imapFolderPath: string;
  bodyOmitted: boolean;
  // unscoped root id, used once to adopt an older thread
  legacyProviderThreadId: string;
};

type ImapSyncFolder = {
  path: string;
  folder: MailThreadFolder;
  archivedAt: Date | null;
  trashedAt: Date | null;
};

/** Folders a user can open; used to sync only the one they navigate to. */
export type InboxSyncFolder = 'INBOX' | 'SPAM' | 'TRASH' | 'SENT' | 'ARCHIVE';

function matchesRequestedFolder(
  entry: ImapSyncFolder,
  requested: InboxSyncFolder[]
): boolean {
  const kind: InboxSyncFolder =
    entry.folder === MailThreadFolder.INBOX
      ? entry.archivedAt
        ? 'ARCHIVE'
        : 'INBOX'
      : (entry.folder as InboxSyncFolder);
  return requested.includes(kind);
}

export type ImapSyncResult = {
  connections: number;
  messages: number;
  /** Deletions and read-state changes picked up (UI should refresh). */
  changed: number;
  errors: number;
  skipped: number;
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

// rewrite cid images to data uris
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
  flags: string[] | undefined,
  imap: {
    folderPath: string;
    uid: number;
    bodyOmitted: boolean;
    imapAttachments: ImapAttachmentMeta[];
  }
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
  const bodies = imap.bodyOmitted
    ? { bodyText: IMAP_BODY_TOO_LARGE_TEXT, bodyHtml: null }
    : resolveStoredMailBodies({
        html: rawHtml ? inlineCidImages(rawHtml, mail) : null,
        text: mail.text ?? null
      });

  const seen = (flags ?? []).some((flag) => flag.toLowerCase() === '\\seen');
  const legacyProviderThreadId = threadIdForMail(mail, fallbackId);

  return {
    aliasId: alias.id,
    providerThreadId: imapScopedThreadId(
      imap.folderPath,
      legacyProviderThreadId
    ),
    legacyProviderThreadId,
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
    isUnread: !seen,
    imapAttachments: imap.imapAttachments,
    imapUid: imap.uid,
    imapFolderPath: imap.folderPath,
    bodyOmitted: imap.bodyOmitted
  };
}

async function persistMessages(
  connection: SyncableConnection,
  messages: ParsedSyncMessage[]
): Promise<number> {
  let imported = 0;
  const blocked = await loadBlockedSenderSet(connection.organizationId);

  for (const message of messages) {
    let persisted: {
      createdMessage: { id: string; threadId: string } | null;
      importedInboundThreadId: string | null;
    };
    try {
      persisted = await prisma.$transaction(async (tx) => {
        let importedInboundThreadId: string | null = null;
        let createdMessage: { id: string; threadId: string } | null = null;
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

        if (
          message.legacyProviderThreadId &&
          message.legacyProviderThreadId !== message.providerThreadId
        ) {
          const legacy = await tx.mailThread.findUnique({
            where: {
              aliasId_providerThreadId: {
                aliasId: message.aliasId,
                providerThreadId: message.legacyProviderThreadId
              }
            },
            select: {
              id: true,
              folder: true,
              archivedAt: true,
              trashedAt: true
            }
          });
          if (
            legacy &&
            legacy.folder === folder &&
            (legacy.archivedAt != null) === (archivedAt != null) &&
            (legacy.trashedAt != null) === (trashedAt != null)
          ) {
            await tx.mailThread.update({
              where: { id: legacy.id },
              data: { providerThreadId: message.providerThreadId }
            });
          }
        }

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
            subject: message.subject
          },
          select: {
            id: true,
            lastMessageAt: true,
            folder: true,
            archivedAt: true,
            trashedAt: true
          }
        });

        const preferred = preferMailFolderState(
          {
            folder: thread.folder,
            archivedAt: thread.archivedAt,
            trashedAt: thread.trashedAt
          },
          { folder, archivedAt, trashedAt }
        );

        const existing = await tx.mailMessage.findUnique({
          where: {
            threadId_providerMessageId: {
              threadId: thread.id,
              providerMessageId: message.providerMessageId
            }
          },
          select: {
            id: true,
            bodyHtml: true,
            bodyText: true,
            bodyOmitted: true
          }
        });

        const messageIdentity = {
          imapUid: message.imapUid,
          imapFolderPath: message.imapFolderPath,
          bodyOmitted: message.bodyOmitted
        };

        if (!existing) {
          const created = await tx.mailMessage.create({
            data: {
              threadId: thread.id,
              providerMessageId: message.providerMessageId,
              direction: message.direction,
              fromAddress: message.fromAddress,
              toAddresses: message.toAddresses,
              ccAddresses: message.ccAddresses,
              bodyText: message.bodyText,
              bodyHtml: message.bodyHtml,
              sentAt: message.sentAt,
              ...messageIdentity
            },
            select: { id: true }
          });
          createdMessage = { id: created.id, threadId: thread.id };
          if (isInbound) {
            importedInboundThreadId = thread.id;
          }

          const newerThanThread = message.sentAt > thread.lastMessageAt;
          await tx.mailThread.update({
            where: { id: thread.id },
            data: {
              ...(newerThanThread ? { lastMessageAt: message.sentAt } : {}),
              folder: preferred.folder,
              archivedAt: preferred.archivedAt,
              trashedAt: preferred.trashedAt,
              isUnread: isInbound ? message.isUnread : false
            }
          });
        } else {
          const keepStoredBody =
            message.bodyOmitted &&
            !existing.bodyOmitted &&
            (existing.bodyText != null || existing.bodyHtml != null);
          if (!keepStoredBody) {
            await tx.mailMessage.update({
              where: { id: existing.id },
              data: {
                ...messageIdentity,
                ...(existing.bodyHtml !== message.bodyHtml ||
                existing.bodyText !== message.bodyText
                  ? {
                      bodyText: message.bodyText,
                      bodyHtml: message.bodyHtml
                    }
                  : {})
              }
            });
          } else {
            await tx.mailMessage.update({
              where: { id: existing.id },
              data: {
                imapUid: message.imapUid,
                imapFolderPath: message.imapFolderPath
              }
            });
          }

          const folderChanged =
            preferred.folder !== thread.folder ||
            (preferred.archivedAt?.getTime() ?? null) !==
              (thread.archivedAt?.getTime() ?? null) ||
            (preferred.trashedAt?.getTime() ?? null) !==
              (thread.trashedAt?.getTime() ?? null);
          const newerThanThread = message.sentAt > thread.lastMessageAt;

          if (folderChanged || newerThanThread) {
            await tx.mailThread.update({
              where: { id: thread.id },
              data: {
                ...(newerThanThread ? { lastMessageAt: message.sentAt } : {}),
                ...(folderChanged
                  ? {
                      folder: preferred.folder,
                      archivedAt: preferred.archivedAt,
                      trashedAt: preferred.trashedAt
                    }
                  : {})
              }
            });
          }
        }

        const messageId = createdMessage?.id ?? existing?.id;
        if (messageId && message.imapAttachments.length > 0) {
          const storedAttachments = await tx.mailMessageAttachment.count({
            where: { messageId }
          });
          if (storedAttachments === 0) {
            await tx.mailMessageAttachment.createMany({
              data: message.imapAttachments.map((attachment) => ({
                id: randomUUID(),
                messageId,
                organizationId: connection.organizationId,
                filename: attachment.filename,
                mediaType: attachment.mediaType,
                sizeBytes: attachment.sizeBytes,
                imapPartId: attachment.part
              }))
            });
            await tx.mailThread.update({
              where: { id: thread.id },
              data: { hasAttachments: true }
            });
          }
        }
        return { createdMessage, importedInboundThreadId };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        continue;
      }
      throw error;
    }
    const importedInboundThreadId = persisted.importedInboundThreadId;
    imported += 1;
    if (importedInboundThreadId && !message.bodyOmitted) {
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
      try {
        const { attributeInboundToWave } = await import(
          '@/lib/outbound/attribution'
        );
        await attributeInboundToWave({
          organizationId: connection.organizationId,
          mailThreadId: importedInboundThreadId,
          fromAddress: message.fromAddress,
          subject: message.subject,
          bodyText: message.bodyText,
          aliasId: message.aliasId
        });
      } catch (error) {
        console.error('[outbound] attribution failed', error);
      }
    }
  }

  return imported;
}

async function dropStaleUidMessages(
  connectionId: string,
  folderPath: string,
  folder: MailThreadFolder
): Promise<void> {
  await prisma.mailMessage.deleteMany({
    where: {
      providerMessageId: {
        startsWith: imapFolderUidPrefix(connectionId, folderPath)
      },
      thread: { alias: { connectionId } }
    }
  });

  const legacy = await prisma.mailMessage.findMany({
    where: {
      providerMessageId: { startsWith: `${connectionId}:` },
      thread: { folder, alias: { connectionId } }
    },
    select: { id: true, providerMessageId: true }
  });
  const legacyIds = legacy
    .filter((row) => isLegacyUidFallback(row.providerMessageId, connectionId))
    .map((row) => row.id);
  if (legacyIds.length > 0) {
    await prisma.mailMessage.deleteMany({ where: { id: { in: legacyIds } } });
  }

  await prisma.mailThread.deleteMany({
    where: {
      folder,
      alias: { connectionId },
      messages: { none: {} },
      notes: { none: {} }
    }
  });
}

function folderMessageWhere(
  connectionId: string,
  syncFolder: ImapSyncFolder
): Prisma.MailMessageWhereInput {
  return {
    thread: { alias: { connectionId } },
    OR: [
      { imapFolderPath: syncFolder.path },
      {
        imapFolderPath: null,
        thread: {
          folder: syncFolder.folder,
          archivedAt: syncFolder.archivedAt ? { not: null } : null,
          trashedAt: syncFolder.trashedAt ? { not: null } : null
        }
      }
    ]
  };
}

async function deleteEmptyFolderThreads(
  connectionId: string,
  folder: MailThreadFolder
): Promise<void> {
  await prisma.mailThread.deleteMany({
    where: {
      folder,
      alias: { connectionId },
      messages: { none: {} },
      notes: { none: {} }
    }
  });
}

async function applyImapFlagChanges(
  connectionId: string,
  folderPath: string,
  changes: Array<{ uid: number; unread: boolean }>
): Promise<number> {
  if (changes.length === 0) return 0;
  const unreadByUid = new Map(
    changes.map((change) => [change.uid, change.unread])
  );
  const uids = [...unreadByUid.keys()];
  const byThread = new Map<string, boolean[]>();
  const threadUnread = new Map<string, boolean>();

  for (let offset = 0; offset < uids.length; offset += 500) {
    const slice = uids.slice(offset, offset + 500);
    const rows = await prisma.mailMessage.findMany({
      where: {
        imapFolderPath: folderPath,
        imapUid: { in: slice },
        thread: { alias: { connectionId } }
      },
      select: {
        imapUid: true,
        threadId: true,
        direction: true,
        thread: { select: { isUnread: true } }
      }
    });
    for (const row of rows) threadUnread.set(row.threadId, row.thread.isUnread);
    for (const row of rows) {
      if (row.imapUid == null) continue;
      if (row.direction !== MailMessageDirection.INBOUND) continue;
      const unread = unreadByUid.get(row.imapUid);
      if (unread == null) continue;
      const list = byThread.get(row.threadId) ?? [];
      list.push(unread);
      byThread.set(row.threadId, list);
    }
  }

  let changed = 0;
  for (const [threadId, flags] of byThread) {
    const isUnread = flags.some(Boolean);
    // modseq fetches echo our own STORE; skip rows that already match
    if (threadUnread.get(threadId) === isUnread) continue;
    await prisma.mailThread.update({
      where: { id: threadId },
      data: { isUnread }
    });
    changed += 1;
  }
  return changed;
}

export async function syncImapConnection(
  connectionId: string,
  options?: {
    client?: import('imapflow').ImapFlow;
    // user actions wait, cron and idle try once
    lock?: 'try' | 'wait';
    /** Sync only these folders (default: all). */
    folders?: InboxSyncFolder[];
    /** Filled with deletions and read-state changes, so callers can refresh the UI. */
    changes?: { count: number };
    /**
     * On servers without CONDSTORE the only way to see read-state changes is
     * fetching flags for every message. Skip that for syncs triggered by new
     * mail; flag events, cron and folder opens still run it.
     */
    skipFullFlagScan?: boolean;
  }
): Promise<number | null> {
  const run = () =>
    syncImapConnectionUnlocked(connectionId, {
      borrowedClient: options?.client,
      onlyFolders: options?.folders,
      changes: options?.changes,
      skipFullFlagScan: options?.skipFullFlagScan
    });
  if (options?.lock === 'wait') {
    return withImapMailboxLock(connectionId, run);
  }
  return tryImapMailboxLock(connectionId, run);
}

async function syncImapConnectionUnlocked(
  connectionId: string,
  {
    borrowedClient,
    onlyFolders,
    changes,
    skipFullFlagScan
  }: {
    borrowedClient?: import('imapflow').ImapFlow;
    onlyFolders?: InboxSyncFolder[];
    changes?: { count: number };
    skipFullFlagScan?: boolean;
  } = {}
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

  const ownsClient = borrowedClient == null;
  let client = borrowedClient;

  if (!client) {
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
    client = new ImapFlow({
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
  }

  if (!client) {
    throw new Error('Mailbox connection is missing encrypted IMAP settings.');
  }

  try {
    if (ownsClient) await client.connect();
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

    const foldersToSync = onlyFolders?.length
      ? syncFolders.filter((entry) =>
          matchesRequestedFolder(entry, onlyFolders)
        )
      : syncFolders;

    const parsedMessages: ParsedSyncMessage[] = [];
    const validityResets: ImapSyncFolder[] = [];
    const previousCursor = parseSyncCursor(connection.syncCursor);
    const nextFolderCursors: Record<string, ImapFolderCursor> = {
      ...(previousCursor.imapFolders ?? {})
    };

    for (const syncFolder of foldersToSync) {
      let lock;
      try {
        lock = await client.getMailboxLock(syncFolder.path);
      } catch {
        continue;
      }

      try {
        const mailbox = client.mailbox;
        if (mailbox === false) continue;

        const messageCount = mailbox.exists ?? 0;
        const uidValidity = Number(mailbox.uidValidity ?? 0);
        const prior = nextFolderCursors[syncFolder.path];
        const canIncremental =
          uidValidity > 0 &&
          prior != null &&
          prior.uidValidity === uidValidity &&
          prior.lastUid > 0;
        const priorLastUid = canIncremental && prior ? prior.lastUid : null;
        const validityChanged =
          uidValidity > 0 && prior != null && prior.uidValidity !== uidValidity;

        const storedCount = await prisma.mailMessage.count({
          where: folderMessageWhere(connection.id, syncFolder)
        });
        const historyDepth = Math.max(MESSAGES_PER_CONNECTION, storedCount);

        if (validityChanged) {
          await dropStaleUidMessages(
            connection.id,
            syncFolder.path,
            syncFolder.folder
          );
          await prisma.mailMessage.updateMany({
            where: {
              imapFolderPath: syncFolder.path,
              thread: { alias: { connectionId: connection.id } }
            },
            data: { imapUid: null }
          });
          validityResets.push(syncFolder);
        }

        let maxUid = priorLastUid ?? 0;

        if (canIncremental) {
          const serverUids = await listServerUids(client);
          if (serverUids && (serverUids.length > 0 || messageCount === 0)) {
            const storedWhere = {
              imapFolderPath: syncFolder.path,
              imapUid: { not: null },
              thread: { alias: { connectionId: connection.id } }
            };
            // Cheap check first: one aggregate row instead of every stored UID.
            // Stored UIDs are a subset of the server's (same window), so equal
            // count and sum means nothing was deleted. Any mismatch falls
            // through to the exact diff below.
            const fingerprint = await prisma.mailMessage.aggregate({
              where: storedWhere,
              _count: { imapUid: true },
              _sum: { imapUid: true },
              _min: { imapUid: true }
            });
            const storedMin = fingerprint._min.imapUid;
            const storedCountWithUid = fingerprint._count.imapUid;
            const unchanged =
              priorLastUid != null &&
              storedUidsMatchServer({
                storedCount: storedCountWithUid,
                storedSum: fingerprint._sum.imapUid ?? 0,
                storedMin,
                lastUid: priorLastUid,
                serverUids
              });
            const stored = unchanged
              ? []
              : await prisma.mailMessage.findMany({
                  where: storedWhere,
                  select: { imapUid: true }
                });
            const gone = expungedUids(
              stored.flatMap((row) =>
                row.imapUid == null ? [] : [row.imapUid]
              ),
              new Set(serverUids)
            );
            for (let offset = 0; offset < gone.length; offset += 500) {
              const slice = gone.slice(offset, offset + 500);
              await prisma.mailMessage.deleteMany({
                where: {
                  imapFolderPath: syncFolder.path,
                  imapUid: { in: slice },
                  thread: { alias: { connectionId: connection.id } }
                }
              });
            }
            if (gone.length > 0) {
              await deleteEmptyFolderThreads(connection.id, syncFolder.folder);
              if (changes) changes.count += gone.length;
            }
          }

          const missingUids = await prisma.mailMessage.count({
            where: {
              ...folderMessageWhere(connection.id, syncFolder),
              imapUid: null
            }
          });
          if (missingUids > 0 && messageCount > 0) {
            const pages = bootstrapSequencePages(
              messageCount,
              Math.max(historyDepth, missingUids),
              IMAP_FETCH_PAGE
            );
            for (const page of pages) {
              const envelopes = await listEnvelopeMessageIds(client, page);
              for (const row of envelopes) {
                const messageId = row.messageId
                  ? normalizeMessageId(row.messageId)
                  : '';
                if (!messageId) continue;
                await prisma.mailMessage.updateMany({
                  where: {
                    providerMessageId: messageId,
                    imapUid: null,
                    ...folderMessageWhere(connection.id, syncFolder)
                  },
                  data: {
                    imapUid: row.uid,
                    imapFolderPath: syncFolder.path
                  }
                });
              }
            }
          }

          const modseq = readModseq(prior?.highestModseq);
          const mailboxModseq = (mailbox as { highestModseq?: bigint | null })
            .highestModseq;
          const flagChanges =
            modseq != null && mailboxModseq != null
              ? await listFlagChanges(client, modseq)
              : skipFullFlagScan
                ? []
                : await listFlagChanges(client);
          const flagged = await applyImapFlagChanges(
            connection.id,
            syncFolder.path,
            flagChanges
          );
          if (changes) changes.count += flagged;
        }

        const ranges: Array<{
          range: string;
          uid: boolean;
          skipUidAtOrBelow?: number;
        }> =
          priorLastUid != null
            ? [
                {
                  range: `${priorLastUid + 1}:*`,
                  uid: true,
                  skipUidAtOrBelow: priorLastUid
                }
              ]
            : bootstrapSequencePages(
                messageCount,
                historyDepth,
                IMAP_FETCH_PAGE
              ).map((range) => ({ range, uid: false }));

        for (const entry of ranges) {
          if (!canIncremental && messageCount === 0) continue;
          const fetched = await fetchImapTextMessages(client, entry.range, {
            uid: entry.uid,
            skipUidAtOrBelow: entry.skipUidAtOrBelow
          });
          if (fetched.maxUid > maxUid) maxUid = fetched.maxUid;

          for (const item of fetched.messages) {
            const fallbackId =
              uidValidity > 0
                ? imapFallbackMessageId(
                    connection.id,
                    syncFolder.path,
                    uidValidity,
                    item.uid
                  )
                : `${connection.id}:${item.uid}`;
            const parsed = parseForSync(
              await simpleParser(item.source),
              connection,
              fallbackId,
              {
                folder: syncFolder.folder,
                archivedAt: syncFolder.archivedAt,
                trashedAt: syncFolder.trashedAt
              },
              item.flags,
              {
                folderPath: syncFolder.path,
                uid: item.uid,
                bodyOmitted: item.bodyOmitted,
                imapAttachments: item.attachments
              }
            );
            if (parsed) parsedMessages.push(parsed);
          }
        }

        if (uidValidity > 0) {
          const mailboxModseq = (mailbox as { highestModseq?: bigint | null })
            .highestModseq;
          nextFolderCursors[syncFolder.path] = {
            uidValidity,
            lastUid: maxUid,
            ...(mailboxModseq != null
              ? { highestModseq: mailboxModseq.toString() }
              : prior?.highestModseq
                ? { highestModseq: prior.highestModseq }
                : {})
          };
        }
      } finally {
        lock.release();
      }
    }

    if (ownsClient) {
      await client.logout();
    } else {
      await client.mailboxOpen('INBOX');
    }
    // inbox outranks spam, sent, trash, and archive
    const folderRank = (message: ParsedSyncMessage): number =>
      mailFolderPresenceRank({
        folder: message.folder,
        archivedAt: message.archivedAt
      });
    const deduped = new Map<string, ParsedSyncMessage>();
    for (const message of parsedMessages) {
      const key = `${message.aliasId}:${message.imapFolderPath}:${message.providerMessageId}`;
      const existing = deduped.get(key);
      if (!existing || folderRank(message) >= folderRank(existing)) {
        deduped.set(key, message);
      }
    }
    const uniqueMessages = [...deduped.values()].sort(
      (left, right) => left.sentAt.getTime() - right.sentAt.getTime()
    );
    const imported = await persistMessages(connection, uniqueMessages);

    for (const syncFolder of validityResets) {
      const seen = new Set(
        uniqueMessages
          .filter((message) => message.imapFolderPath === syncFolder.path)
          .map((message) => message.providerMessageId)
      );
      const rows = await prisma.mailMessage.findMany({
        where: folderMessageWhere(connection.id, syncFolder),
        select: { id: true, providerMessageId: true }
      });
      const dropIds = rows
        .filter((row) => !seen.has(row.providerMessageId))
        .map((row) => row.id);
      for (let offset = 0; offset < dropIds.length; offset += 500) {
        await prisma.mailMessage.deleteMany({
          where: { id: { in: dropIds.slice(offset, offset + 500) } }
        });
      }
      if (dropIds.length > 0) {
        await deleteEmptyFolderThreads(connection.id, syncFolder.folder);
      }
    }

    const previousRecord =
      connection.syncCursor &&
      typeof connection.syncCursor === 'object' &&
      !Array.isArray(connection.syncCursor)
        ? (connection.syncCursor as Record<string, unknown>)
        : {};

    await prisma.mailboxConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        lastError: null,
        syncCursor: {
          ...previousRecord,
          imapFolders: nextFolderCursors
        } as Prisma.InputJsonValue
      }
    });

    return imported;
  } catch (error) {
    if (ownsClient) {
      try {
        await client.close();
      } catch {
        // ignore cleanup errors
      }
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
  folders?: InboxSyncFolder[];
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
    changed: 0,
    errors: 0,
    skipped: 0
  };
  const importedByOrg = new Map<string, number>();
  const changedByOrg = new Map<string, number>();

  const outcomes = await mapPool(
    connections,
    IMAP_SYNC_CONCURRENCY,
    async (connection) => {
      const changes = { count: 0 };
      try {
        const imported = await syncImapConnection(connection.id, {
          changes,
          folders: options?.folders,
          // opening a folder is a user action: wait for IDLE/cron, don't skip
          ...(options?.folders ? { lock: 'wait' as const } : {})
        });
        if (imported == null) {
          return {
            organizationId: connection.organizationId,
            imported: 0,
            changed: 0,
            error: false,
            skipped: true
          };
        }
        return {
          organizationId: connection.organizationId,
          imported,
          changed: changes.count,
          error: false,
          skipped: false
        };
      } catch {
        return {
          organizationId: connection.organizationId,
          imported: 0,
          changed: 0,
          error: true,
          skipped: false
        };
      }
    }
  );

  for (const outcome of outcomes) {
    if (outcome.error) {
      result.errors += 1;
      continue;
    }
    if (outcome.skipped) {
      result.skipped += 1;
      continue;
    }
    result.messages += outcome.imported;
    result.changed += outcome.changed;
    if (outcome.changed > 0) {
      changedByOrg.set(
        outcome.organizationId,
        (changedByOrg.get(outcome.organizationId) ?? 0) + outcome.changed
      );
    }
    if (outcome.imported > 0) {
      importedByOrg.set(
        outcome.organizationId,
        (importedByOrg.get(outcome.organizationId) ?? 0) + outcome.imported
      );
    }
  }

  // deletions / read-state only: refresh without a "new email" toast
  for (const organizationId of changedByOrg.keys()) {
    if (importedByOrg.has(organizationId)) continue;
    void publishOrgEvent(organizationId, {
      type: 'inbox.synced',
      actorId: options?.actorId,
      actorName: options?.actorName,
      count: 0
    });
  }

  for (const [organizationId, count] of importedByOrg) {
    void publishOrgEvent(organizationId, {
      type: 'inbox.synced',
      actorId: options?.actorId,
      actorName: options?.actorName,
      count
    });
  }

  return result;
}
