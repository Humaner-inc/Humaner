import 'server-only';

import {
  MailConnectionStatus,
  MailMessageDirection,
  MailProvider,
  type Prisma
} from '@prisma/client';
import { simpleParser, type AddressObject, type ParsedMail } from 'mailparser';
import sanitizeHtml from 'sanitize-html';

import { prisma } from '@/lib/db/prisma';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

const CONNECTIONS_PER_RUN = 10;
const MESSAGES_PER_CONNECTION = 100;
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_CHARS = 500_000;

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
};

export type ImapSyncResult = {
  connections: number;
  messages: number;
  errors: number;
};

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

const MAIL_HTML_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  'img',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'center',
  'font',
  'picture',
  'source',
  'figure',
  'figcaption'
]);

const MAIL_HTML_ATTRS: sanitizeHtml.IOptions['allowedAttributes'] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  '*': [
    'style',
    'class',
    'align',
    'valign',
    'bgcolor',
    'width',
    'height',
    'border',
    'role',
    'dir',
    'lang'
  ],
  a: ['href', 'name', 'target', 'rel', 'style', 'class'],
  img: [
    'src',
    'srcset',
    'alt',
    'title',
    'width',
    'height',
    'style',
    'class',
    'align',
    'border',
    'loading'
  ],
  table: [
    'width',
    'height',
    'cellpadding',
    'cellspacing',
    'border',
    'align',
    'bgcolor',
    'role',
    'style',
    'class'
  ],
  td: [
    'colspan',
    'rowspan',
    'width',
    'height',
    'align',
    'valign',
    'bgcolor',
    'style',
    'class'
  ],
  th: [
    'colspan',
    'rowspan',
    'width',
    'height',
    'align',
    'valign',
    'bgcolor',
    'style',
    'class'
  ],
  tr: ['align', 'valign', 'bgcolor', 'style', 'class'],
  font: ['color', 'face', 'size', 'style'],
  source: ['srcset', 'media', 'type', 'sizes']
};

function sanitizedMailHtml(value: string | false | undefined): string | null {
  if (!value) return null;

  return sanitizeHtml(value, {
    allowedTags: MAIL_HTML_TAGS,
    allowedAttributes: MAIL_HTML_ATTRS,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      // Remote + data-URI images (tracking pixels / small embeds). cid: needs
      // a separate attachment rewrite pipeline and is intentionally omitted.
      img: ['http', 'https', 'data']
    },
    // Keep marketing-email inline CSS; scripts/handlers are still stripped.
    parseStyleAttributes: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank'
      })
    }
  }).slice(0, MAX_BODY_CHARS);
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
  fallbackId: string
): ParsedSyncMessage | null {
  const toAddresses = addressObjectValues(mail.to);
  const ccAddresses = addressObjectValues(mail.cc);
  const recipientAddresses = new Set([
    ...toAddresses,
    ...ccAddresses,
    ...headerAddresses(mail)
  ]);
  const alias = connection.aliases.find((item) =>
    recipientAddresses.has(normalizeAddress(item.address))
  );

  if (!alias) return null;

  const fromAddress = addressObjectValues(mail.from)[0];
  if (!fromAddress) return null;

  const providerMessageId = normalizeMessageId(mail.messageId ?? fallbackId);
  if (!providerMessageId) return null;

  const aliasAddresses = new Set(
    connection.aliases.map((item) => normalizeAddress(item.address))
  );

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
    bodyText: mail.text?.slice(0, MAX_BODY_CHARS) || null,
    bodyHtml: sanitizedMailHtml(mail.html),
    sentAt: mail.date ?? new Date()
  };
}

async function persistMessages(
  connection: SyncableConnection,
  messages: ParsedSyncMessage[]
): Promise<number> {
  let imported = 0;

  for (const message of messages) {
    await prisma.$transaction(async (tx) => {
      const isInbound = message.direction === MailMessageDirection.INBOUND;

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
          isUnread: isInbound
        },
        update: {
          subject: message.subject
        },
        select: { id: true, lastMessageAt: true }
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

        const newerThanThread = message.sentAt > thread.lastMessageAt;
        await tx.mailThread.update({
          where: { id: thread.id },
          data: {
            ...(newerThanThread ? { lastMessageAt: message.sentAt } : {}),
            ...(isInbound
              ? { isUnread: true, archivedAt: null }
              : { isUnread: false })
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
    const lock = await client.getMailboxLock('INBOX');
    const parsedMessages: ParsedSyncMessage[] = [];

    try {
      const mailbox = client.mailbox;
      const messageCount = mailbox === false ? 0 : (mailbox?.exists ?? 0);
      const start = Math.max(1, messageCount - MESSAGES_PER_CONNECTION + 1);

      if (messageCount > 0) {
        for await (const item of client.fetch(`${start}:*`, {
          uid: true,
          source: true
        })) {
          if (!item.source || item.source.length > MAX_SOURCE_BYTES) continue;

          const fallbackId = `${connection.id}:${item.uid ?? item.seq}`;
          const parsed = parseForSync(
            await simpleParser(item.source),
            connection,
            fallbackId
          );
          if (parsed) parsedMessages.push(parsed);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    parsedMessages.sort(
      (left, right) => left.sentAt.getTime() - right.sentAt.getTime()
    );
    const imported = await persistMessages(connection, parsedMessages);

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
    await prisma.mailboxConnection.update({
      where: { id: connection.id },
      data: { lastError: message.slice(0, 2000) }
    });
    throw error;
  }
}

export async function syncImapMailboxes(options?: {
  organizationId?: string;
  connectionId?: string;
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
    select: { id: true }
  });

  const result: ImapSyncResult = {
    connections: connections.length,
    messages: 0,
    errors: 0
  };

  for (const connection of connections) {
    try {
      result.messages += await syncImapConnection(connection.id);
    } catch {
      result.errors += 1;
    }
  }

  return result;
}
