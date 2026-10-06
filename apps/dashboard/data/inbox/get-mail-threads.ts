import 'server-only';

import { cache } from 'react';
import { after } from 'next/server';

import { dedupedAuth } from '@/lib/auth';
import { userCanAccessDashboardPage } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { loadUserContactsByEmail } from '@/lib/contacts/contact-record';
import { prisma } from '@/lib/db/prisma';
import { updateMailThreadsByIds } from '@/lib/db/unique-mutations';
import { humanizeMailboxSyncError } from '@/lib/inbox/gmail-sync-errors';
import { loadOmittedImapBodies } from '@/lib/inbox/load-omitted-imap-bodies';
import {
  aliasIdFilter,
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import { mailAssigneeLabel } from '@/lib/inbox/mail-assignee';
import {
  getMailProviderById,
  MAIL_PROVIDERS
} from '@/lib/inbox/mail-providers';
import {
  INBOX_ACTIVE_WHERE,
  mailThreadListWhere,
  type MailListFolder
} from '@/lib/inbox/mail-thread-folder';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';
import { getMailboxSignatureIconUrl } from '@/lib/urls/get-mailbox-signature-icon-url';
import { SIGNATURE_ICON_HEIGHT_DEFAULT } from '@/schemas/inbox/update-mailbox-signature-schema';

/** Must match `MAILBOX_SIGNATURE_ICON_CID` in mailbox-signature.ts */
const SIGNATURE_ICON_CID = 'signature-icon@humaner';

function rewriteSignatureCidForDisplay(
  html: string | null,
  iconUrl: string | null
): string | null {
  if (!html || !iconUrl) return html;
  if (!html.includes(SIGNATURE_ICON_CID)) return html;
  return html.replace(
    new RegExp(
      `(?:cid:)${SIGNATURE_ICON_CID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'gi'
    ),
    iconUrl
  );
}

export type MailTagItem = {
  id: string;
  name: string;
  color: string;
  /** Null = available on all aliases. */
  aliasId: string | null;
};

export type MailThreadListItem = {
  id: string;
  subject: string;
  status: string;
  aliasAddress: string;
  aliasId: string;
  assigneeKind: string;
  assigneeName: string | null;
  lastMessageAt: string;
  fromAddress: string | null;
  fromName: string | null;
  preview: string | null;
  isUnread: boolean;
  isPinned: boolean;
  messageCount: number;
  awaitingReply: boolean;
  hasAttachments: boolean;
  tag: MailTagItem | null;
  contactId: string | null;
  contactImage: string | null;
};

export type MailMessageAttachmentItem = {
  id: string;
  filename: string;
  mediaType: string;
  sizeBytes: number;
};

export type MailWorkspaceDocumentSummary = {
  id: string;
  kind: 'INVOICE' | 'QUOTE';
  status: string;
  reference: string;
  counterpartyName: string | null;
  counterpartyEmail: string | null;
  amountCents: number;
  currency: string;
  dueAt: string | null;
  issuedAt: string;
  /** Line items and parties used to draw the thread preview. */
  payload: unknown;
};

export type MailThreadBrand = {
  name: string;
  email: string | null;
  logoUrl: string | null;
  website: string | null;
  address: string | null;
  phone: string | null;
  taxId: string | null;
};

export type MailThreadDetail = {
  id: string;
  subject: string;
  status: string;
  aliasAddress: string;
  aliasId: string;
  lastMessageAt: string;
  isUnread: boolean;
  isPinned: boolean;
  folder: string;
  archivedAt: string | null;
  hasAttachments: boolean;
  document: MailWorkspaceDocumentSummary | null;
  brand?: MailThreadBrand;
  assigneeKind: string;
  assigneeId: string | null;
  handoffTicketId: string | null;
  handoffTicketNumber: number | null;
  sharedNoteDraft: string | null;
  notes: Array<{
    id: string;
    body: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  }>;
  tag: MailTagItem | null;
  sendAliases: MailSendAlias[];
  signatureText: string | null;
  signatureIconUrl: string | null;
  signatureIconHeight: number;
  savedContacts: Array<{
    email: string;
    id: string;
    image: string | null;
  }>;
  messages: Array<{
    id: string;
    direction: string;
    fromAddress: string;
    toAddresses: string[];
    ccAddresses: string[];
    bodyText: string | null;
    bodyHtml: string | null;
    sentAt: string;
    attachments: MailMessageAttachmentItem[];
  }>;
};

export type MailInboxOption = {
  id: string;
  address: string;
  displayName: string | null;
  unreadCount: number;
  connectionId: string;
  connectionEmail: string;
  providerName: string;
  signatureText: string | null;
  signatureIconUrl: string | null;
  signatureIconHeight: number;
};

export type MailSendAlias = {
  id: string;
  address: string;
  displayName: string | null;
};

const MAIL_THREAD_MESSAGE_CAP = 80;
const MAIL_THREAD_OPEN_BODIES = 2;

const mailMessageHeaderSelect = {
  id: true,
  direction: true,
  fromAddress: true,
  toAddresses: true,
  ccAddresses: true,
  sentAt: true,
  attachments: {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      filename: true,
      mediaType: true,
      sizeBytes: true
    }
  }
} as const;

function previewText(value: string | null): string | null {
  if (!value) return null;
  return (
    value
      // Outbound signatures write this placeholder into plain text for MIME
      // clients — never show it in the thread list preview.
      .replace(/\[signature image\]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180) || null
  );
}

function compactMailBodies(message: {
  bodyHtml: string | null;
  bodyText: string | null;
}): { bodyHtml: string | null; bodyText: string | null } {
  // Keep both parts — HTML-only mail still needs bodyHtml for the iframe,
  // and bodyText backs suggestions / forward / plain fallbacks.
  return {
    bodyHtml: message.bodyHtml,
    bodyText: message.bodyText
  };
}

function parseFromDisplay(fromAddress: string | null): {
  email: string | null;
  name: string | null;
} {
  if (!fromAddress) return { email: null, name: null };
  const match = fromAddress.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '') || null;
    return { email: match[2].trim().toLowerCase(), name };
  }
  return { email: fromAddress.trim().toLowerCase(), name: null };
}

async function requireInboxReadSession() {
  const session = await dedupedAuth();
  if (!checkSession(session)) return null;
  if (!(await userCanAccessDashboardPage(session.user.id, 'inbox'))) {
    return null;
  }
  return session;
}

function unreadInboxThreadWhere(
  organizationId: string,
  scopedAliasIds?: { in: string[] }
) {
  return {
    organizationId,
    isUnread: true,
    ...INBOX_ACTIVE_WHERE,
    ...(scopedAliasIds ? { aliasId: scopedAliasIds } : {})
  };
}

export const getMailInboxes = cache(async (): Promise<MailInboxOption[]> => {
  const session = await requireInboxReadSession();
  if (!session) return [];

  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  const scope = await resolveMailAliasScope({
    userId: session.user.id,
    organizationId
  });
  const scopedAliasIds = aliasIdFilter(scope);

  const aliasWhere = {
    organizationId,
    enabled: true,
    ...(scopedAliasIds ? { id: scopedAliasIds } : {})
  };

  const [aliases, unreadRows] = await Promise.all([
    prisma.mailAlias.findMany({
      where: aliasWhere,
      orderBy: { address: 'asc' },
      select: {
        id: true,
        address: true,
        displayName: true,
        connection: {
          select: {
            id: true,
            email: true,
            provider: true,
            providerPresetId: true,
            signatureText: true,
            signatureIconHash: true,
            signatureIconHeight: true
          }
        }
      }
    }),
    prisma.mailThread.groupBy({
      by: ['aliasId'],
      where: unreadInboxThreadWhere(organizationId, scopedAliasIds),
      _count: { id: true }
    })
  ]);

  if (aliases.length === 0) return [];

  const unreadByAlias = new Map(
    unreadRows.map((row) => [row.aliasId, row._count.id])
  );

  return aliases.map((alias) => {
    const preset = alias.connection.providerPresetId
      ? getMailProviderById(alias.connection.providerPresetId)
      : undefined;

    return {
      id: alias.id,
      address: alias.address,
      displayName: alias.displayName,
      unreadCount: unreadByAlias.get(alias.id) ?? 0,
      connectionId: alias.connection.id,
      connectionEmail: alias.connection.email,
      providerName: preset?.name ?? alias.connection.provider,
      signatureText: alias.connection.signatureText,
      signatureIconUrl: alias.connection.signatureIconHash
        ? getMailboxSignatureIconUrl(
            alias.connection.id,
            alias.connection.signatureIconHash
          )
        : null,
      signatureIconHeight:
        alias.connection.signatureIconHeight || SIGNATURE_ICON_HEIGHT_DEFAULT
    };
  });
});

export const getMailUnreadCount = cache(async (): Promise<number> => {
  const session = await requireInboxReadSession();
  if (!session) return 0;

  const organizationId = session.user.organizationId;
  if (!organizationId) return 0;

  const scope = await resolveMailAliasScope({
    userId: session.user.id,
    organizationId
  });
  const scopedAliasIds = aliasIdFilter(scope);
  if (scope.type === 'ids' && scope.aliasIds.length === 0) return 0;

  return prisma.mailThread.count({
    where: unreadInboxThreadWhere(organizationId, scopedAliasIds)
  });
});

export async function getMailThreads(options?: {
  assignedToCurrentUser?: boolean;
  folder?: MailListFolder;
  aliasId?: string | null;
  connectionId?: string | null;
  unreadOnly?: boolean;
  status?: 'OPEN' | 'PENDING' | 'RESOLVED' | 'SNOOZED';
  tagId?: string | null;
  /** Threads tagged with any outbound wave (`wave:` prefix) or a specific wave tag. */
  outboundOnly?: boolean;
}): Promise<MailThreadListItem[]> {
  const session = await requireInboxReadSession();
  if (!session) return [];

  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  const folder = options?.folder ?? 'inbox';
  const scope = await resolveMailAliasScope({
    userId: session.user.id,
    organizationId
  });
  const scopedAliasIds = aliasIdFilter(scope);
  const assignedToCurrentUser = options?.assignedToCurrentUser === true;
  if (
    !assignedToCurrentUser &&
    scope.type === 'ids' &&
    scope.aliasIds.length === 0
  ) {
    return [];
  }
  if (
    !assignedToCurrentUser &&
    options?.aliasId &&
    scope.type === 'ids' &&
    !scope.aliasIds.includes(options.aliasId)
  ) {
    return [];
  }

  const threads = await prisma.mailThread.findMany({
    where: {
      organizationId,
      ...(assignedToCurrentUser
        ? {
            assigneeId: session.user.id,
            archivedAt: null,
            folder: { in: ['INBOX', 'SENT'] }
          }
        : mailThreadListWhere(folder)),
      ...(options?.unreadOnly ? { isUnread: true } : {}),
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.tagId ? { tags: { some: { tagId: options.tagId } } } : {}),
      ...(options?.outboundOnly && !options?.tagId
        ? {
            tags: {
              some: {
                tag: { name: { startsWith: 'wave:' } }
              }
            }
          }
        : {}),
      ...(assignedToCurrentUser
        ? {}
        : options?.connectionId
          ? {
              alias: {
                connectionId: options.connectionId,
                ...(scopedAliasIds ? { id: scopedAliasIds } : {})
              }
            }
          : options?.aliasId
            ? { aliasId: options.aliasId }
            : scopedAliasIds
              ? { aliasId: scopedAliasIds }
              : {})
    },
    orderBy: [{ isPinned: 'desc' }, { lastMessageAt: 'desc' }],
    take: 200,
    select: {
      id: true,
      subject: true,
      status: true,
      isUnread: true,
      isPinned: true,
      hasAttachments: true,
      lastMessageAt: true,
      alias: { select: { id: true, address: true } },
      assigneeKind: true,
      assignee: { select: { name: true } },
      _count: { select: { messages: true } },
      tags: {
        take: 1,
        orderBy: { createdAt: 'asc' },
        select: {
          tag: {
            select: { id: true, name: true, color: true, aliasId: true }
          }
        }
      },
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: {
          fromAddress: true,
          toAddresses: true,
          bodyText: true,
          direction: true,
          sentAt: true
        }
      }
    }
  });

  const mapped = threads.map((thread) => {
    const latest = thread.messages[0];
    const from = parseFromDisplay(
      latest?.direction === 'OUTBOUND'
        ? (latest.toAddresses[0] ?? null)
        : (latest?.fromAddress ?? null)
    );
    // Prefer the latest message clock so the list never shows the first-email age
    // after a reply (thread.lastMessageAt can lag until the next sync write).
    const lastActivityAt =
      latest && latest.sentAt > thread.lastMessageAt
        ? latest.sentAt
        : thread.lastMessageAt;
    const awaitingReply = latest?.direction === 'INBOUND';
    // A sent reply opens the thread — never keep the unopened state when
    // the latest message is outbound (stale isUnread can otherwise linger).
    const isUnread = Boolean(thread.isUnread && awaitingReply);

    return {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      aliasAddress: thread.alias.address,
      aliasId: thread.alias.id,
      assigneeKind: thread.assigneeKind,
      assigneeName: mailAssigneeLabel({
        assigneeKind: thread.assigneeKind,
        assigneeName: thread.assignee?.name ?? null
      }),
      lastMessageAt: lastActivityAt.toISOString(),
      fromAddress: from.email,
      fromName: from.name,
      preview: previewText(latest?.bodyText ?? null),
      isUnread,
      isPinned: thread.isPinned,
      messageCount: thread._count.messages,
      awaitingReply,
      hasAttachments: thread.hasAttachments,
      tag: thread.tags[0]?.tag ?? null
    };
  });

  const contactsByEmail = await loadUserContactsByEmail(
    session.user.id,
    mapped.flatMap((thread) => (thread.fromAddress ? [thread.fromAddress] : []))
  );
  const listed = mapped.map((thread) => {
    const saved = thread.fromAddress
      ? contactsByEmail.get(thread.fromAddress)
      : undefined;
    return {
      ...thread,
      contactId: saved?.id ?? null,
      contactImage: saved?.image ?? null
    };
  });

  // Heal stale unread flags for threads we already replied to.
  const staleOpenedIds = threads
    .filter(
      (thread) =>
        thread.isUnread && thread.messages[0]?.direction === 'OUTBOUND'
    )
    .map((thread) => thread.id);
  if (staleOpenedIds.length > 0) {
    after(() => {
      void updateMailThreadsByIds(prisma, staleOpenedIds, { isUnread: false });
    });
  }

  if (options?.unreadOnly) {
    return listed.filter((thread) => thread.isUnread);
  }

  return listed;
}

export const getMailThread = cache(
  async (threadId: string): Promise<MailThreadDetail | null> => {
    const session = await requireInboxReadSession();
    if (!session) return null;

    const organizationId = session.user.organizationId;
    if (!organizationId) return null;

    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });
    const scopedAliasIds = aliasIdFilter(scope);
    const threadAccess = mailThreadAccessWhere({
      organizationId,
      userId: session.user.id,
      scope
    });
    const messageWhere = {
      threadId,
      thread: threadAccess
    };

    const [thread, latestBodies, olderHeaders, document, organization] =
      await Promise.all([
        prisma.mailThread.findFirst({
          where: {
            id: threadId,
            ...threadAccess
          },
          select: {
            id: true,
            subject: true,
            status: true,
            isUnread: true,
            isPinned: true,
            hasAttachments: true,
            folder: true,
            archivedAt: true,
            assigneeKind: true,
            assigneeId: true,
            handoffTicketId: true,
            handoffTicket: { select: { ticketNumber: true } },
            sharedNoteDraft: true,
            lastMessageAt: true,
            alias: {
              select: {
                id: true,
                address: true,
                connection: {
                  select: {
                    id: true,
                    signatureText: true,
                    signatureIconHash: true,
                    signatureIconHeight: true,
                    aliases: {
                      where: {
                        enabled: true,
                        ...(scopedAliasIds ? { id: scopedAliasIds } : {})
                      },
                      orderBy: { address: 'asc' },
                      select: { id: true, address: true, displayName: true }
                    }
                  }
                }
              }
            },
            notes: {
              orderBy: { createdAt: 'asc' },
              take: 40,
              select: {
                id: true,
                body: true,
                authorId: true,
                createdAt: true,
                author: { select: { name: true } }
              }
            },
            tags: {
              take: 1,
              orderBy: { createdAt: 'asc' },
              select: {
                tag: {
                  select: { id: true, name: true, color: true, aliasId: true }
                }
              }
            }
          }
        }),
        prisma.mailMessage.findMany({
          where: messageWhere,
          orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
          take: MAIL_THREAD_OPEN_BODIES,
          select: {
            ...mailMessageHeaderSelect,
            bodyText: true,
            bodyHtml: true,
            bodyOmitted: true
          }
        }),
        prisma.mailMessage.findMany({
          where: messageWhere,
          orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
          skip: MAIL_THREAD_OPEN_BODIES,
          take: MAIL_THREAD_MESSAGE_CAP - MAIL_THREAD_OPEN_BODIES,
          select: mailMessageHeaderSelect
        }),
        prisma.workspaceDocument.findFirst({
          where: { sourceThreadId: threadId, organizationId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            kind: true,
            status: true,
            reference: true,
            counterpartyName: true,
            counterpartyEmail: true,
            amountCents: true,
            currency: true,
            dueAt: true,
            issuedAt: true,
            payload: true
          }
        }),
        prisma.organization.findFirst({
          where: { id: organizationId },
          select: {
            name: true,
            email: true,
            logoUrl: true,
            website: true,
            address: true,
            phone: true,
            taxId: true
          }
        })
      ]);

    if (!thread) return null;

    const omittedIds = latestBodies
      .filter((message) => message.bodyOmitted)
      .map((message) => message.id);
    const loadedBodies =
      omittedIds.length > 0
        ? await loadOmittedImapBodies(omittedIds, organizationId)
        : new Map<
            string,
            { bodyText: string | null; bodyHtml: string | null }
          >();

    const signatureIconUrl = thread.alias.connection.signatureIconHash
      ? getMailboxSignatureIconUrl(
          thread.alias.connection.id,
          thread.alias.connection.signatureIconHash
        )
      : null;
    const olderMessages = olderHeaders.toReversed().map((message) => ({
      id: message.id,
      direction: message.direction,
      fromAddress: message.fromAddress,
      toAddresses: message.toAddresses,
      ccAddresses: message.ccAddresses,
      bodyText: null,
      bodyHtml: null,
      sentAt: message.sentAt.toISOString(),
      attachments: message.attachments
    }));
    const openMessages = latestBodies.toReversed().map((message) => {
      const loaded = loadedBodies.get(message.id);
      const bodies = compactMailBodies(loaded ?? message);
      return {
        id: message.id,
        direction: message.direction,
        fromAddress: message.fromAddress,
        toAddresses: message.toAddresses,
        ccAddresses: message.ccAddresses,
        bodyText: bodies.bodyText,
        bodyHtml: rewriteSignatureCidForDisplay(
          bodies.bodyHtml,
          signatureIconUrl
        ),
        sentAt: message.sentAt.toISOString(),
        attachments: message.attachments
      };
    });
    const messages = [...olderMessages, ...openMessages];
    const latest = messages[messages.length - 1];
    const awaitingReply = latest?.direction === 'INBOUND';
    const counterparties = messages.flatMap((message) => [
      message.fromAddress,
      ...message.toAddresses,
      ...message.ccAddresses
    ]);
    const savedByEmail = await loadUserContactsByEmail(
      session.user.id,
      counterparties
    );

    return {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      aliasAddress: thread.alias.address,
      aliasId: thread.alias.id,
      lastMessageAt: thread.lastMessageAt.toISOString(),
      isUnread: Boolean(thread.isUnread && awaitingReply),
      isPinned: thread.isPinned,
      folder: thread.folder,
      archivedAt: thread.archivedAt?.toISOString() ?? null,
      hasAttachments: thread.hasAttachments,
      document: document
        ? {
            id: document.id,
            kind: document.kind,
            status: document.status,
            reference: document.reference,
            counterpartyName: document.counterpartyName,
            counterpartyEmail: document.counterpartyEmail,
            amountCents: document.amountCents,
            currency: document.currency,
            dueAt: document.dueAt?.toISOString() ?? null,
            issuedAt: document.issuedAt.toISOString(),
            payload: document.payload
          }
        : null,
      brand: {
        name: organization?.name ?? 'Workspace',
        email: organization?.email ?? null,
        logoUrl: organization?.logoUrl ?? null,
        website: organization?.website ?? null,
        address: organization?.address ?? null,
        phone: organization?.phone ?? null,
        taxId: organization?.taxId ?? null
      },
      assigneeKind: thread.assigneeKind,
      assigneeId: thread.assigneeId,
      handoffTicketId: thread.handoffTicketId,
      handoffTicketNumber: thread.handoffTicket?.ticketNumber ?? null,
      sharedNoteDraft: thread.sharedNoteDraft,
      notes: thread.notes.map((note) => ({
        id: note.id,
        body: note.body,
        authorId: note.authorId,
        authorName: note.author.name,
        createdAt: note.createdAt.toISOString()
      })),
      tag: thread.tags[0]?.tag ?? null,
      sendAliases: thread.alias.connection.aliases,
      signatureText: thread.alias.connection.signatureText,
      signatureIconUrl,
      signatureIconHeight:
        thread.alias.connection.signatureIconHeight ||
        SIGNATURE_ICON_HEIGHT_DEFAULT,
      savedContacts: [...savedByEmail.values()],
      messages
    };
  }
);

export async function getMailMessageBodies(
  threadId: string,
  messageIds: string[]
): Promise<
  Array<{ id: string; bodyText: string | null; bodyHtml: string | null }>
> {
  if (messageIds.length === 0) return [];

  const session = await requireInboxReadSession();
  if (!session) return [];

  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  const scope = await resolveMailAliasScope({
    userId: session.user.id,
    organizationId
  });

  const rows = await prisma.mailMessage.findMany({
    where: {
      id: { in: messageIds },
      threadId,
      thread: mailThreadAccessWhere({
        organizationId,
        userId: session.user.id,
        scope
      })
    },
    select: {
      id: true,
      bodyText: true,
      bodyHtml: true,
      thread: {
        select: {
          alias: {
            select: {
              connection: {
                select: {
                  id: true,
                  signatureIconHash: true
                }
              }
            }
          }
        }
      }
    }
  });

  return rows.map((row) => {
    const bodies = compactMailBodies(row);
    const connection = row.thread.alias.connection;
    const iconUrl = connection.signatureIconHash
      ? getMailboxSignatureIconUrl(connection.id, connection.signatureIconHash)
      : null;
    return {
      id: row.id,
      bodyText: bodies.bodyText,
      bodyHtml: rewriteSignatureCidForDisplay(bodies.bodyHtml, iconUrl)
    };
  });
}

export async function getMailTags(): Promise<MailTagItem[]> {
  const session = await requireInboxReadSession();
  if (!session) return [];

  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  return prisma.mailTag.findMany({
    where: { organizationId },
    orderBy: [{ aliasId: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, color: true, aliasId: true }
  });
}

export type ConnectedMailboxItem = {
  id: string;
  email: string;
  providerId: string | null;
  providerName: string;
  logoDomain: string;
  aliasCount: number;
  status: string;
  /** Why sync or send last failed — shown next to a broken connection. */
  lastError: string | null;
  lastSyncedAt: string | null;
  signatureText: string | null;
  signatureIconUrl: string | null;
  signatureIconHeight: number;
};

function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  return host.trim().toLowerCase().replace(/\.$/, '');
}

function findProviderByMailHosts(
  imapHost: string | null | undefined,
  smtpHost: string | null | undefined
): (typeof MAIL_PROVIDERS)[number] | undefined {
  const imap = normalizeHost(imapHost);
  const smtp = normalizeHost(smtpHost);
  if (!imap && !smtp) return undefined;

  return MAIL_PROVIDERS.find((provider) => {
    const providerImap = normalizeHost(provider.imapHost);
    const providerSmtp = normalizeHost(provider.smtpHost);
    return (
      (imap != null && providerImap != null && imap === providerImap) ||
      (smtp != null && providerSmtp != null && smtp === providerSmtp)
    );
  });
}

function findProviderByEmailDomain(
  email: string
): (typeof MAIL_PROVIDERS)[number] | undefined {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (!domain) return undefined;

  return MAIL_PROVIDERS.find((provider) => {
    const logo = provider.logoDomain.toLowerCase();
    return domain === logo || domain.endsWith(`.${logo}`);
  });
}

function resolveProviderFromConnection(connection: {
  providerPresetId: string | null;
  email: string;
  imapHost?: string | null;
  smtpHost?: string | null;
}): { providerId: string | null; providerName: string; logoDomain: string } {
  const hostMatch = findProviderByMailHosts(
    connection.imapHost,
    connection.smtpHost
  );
  const preset = connection.providerPresetId
    ? getMailProviderById(connection.providerPresetId)
    : undefined;

  // Prefer exact IMAP/SMTP host match when it disagrees with a stale preset id.
  const resolved =
    hostMatch ?? preset ?? findProviderByEmailDomain(connection.email);

  if (resolved) {
    return {
      providerId: resolved.id,
      providerName: resolved.name,
      logoDomain: resolved.logoDomain
    };
  }

  const domain = connection.email.split('@')[1]?.toLowerCase() ?? '';
  return {
    providerId: null,
    providerName: domain || 'Mailbox',
    logoDomain: domain || 'mail'
  };
}

export async function getConnectedProviderPresetIds(): Promise<string[]> {
  const connections = await getMailboxConnections();
  return [
    ...new Set(
      connections
        .map((connection) => connection.providerId)
        .filter((id): id is string => Boolean(id))
    )
  ];
}

export async function getMailboxConnections(): Promise<ConnectedMailboxItem[]> {
  const session = await requireInboxReadSession();
  if (!session) return [];

  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  const connections = await prisma.mailboxConnection.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      providerPresetId: true,
      status: true,
      lastError: true,
      lastSyncedAt: true,
      imapHost: true,
      smtpHost: true,
      signatureText: true,
      signatureIconHash: true,
      signatureIconHeight: true,
      _count: { select: { aliases: true } }
    }
  });

  return connections.map((connection) => {
    const provider = resolveProviderFromConnection({
      providerPresetId: connection.providerPresetId,
      email: connection.email,
      imapHost: decryptSensitiveField(connection.imapHost),
      smtpHost: decryptSensitiveField(connection.smtpHost)
    });
    return {
      id: connection.id,
      email: connection.email,
      providerId: provider.providerId,
      providerName: provider.providerName,
      logoDomain: provider.logoDomain,
      aliasCount: connection._count.aliases,
      status: connection.status,
      lastError: humanizeMailboxSyncError(connection.lastError),
      lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
      signatureText: connection.signatureText,
      signatureIconUrl: connection.signatureIconHash
        ? getMailboxSignatureIconUrl(
            connection.id,
            connection.signatureIconHash
          )
        : null,
      signatureIconHeight: connection.signatureIconHeight
    };
  });
}
