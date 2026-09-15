import 'server-only';

import { cache } from 'react';
import { after } from 'next/server';

import { dedupedAuth } from '@/lib/auth';
import { userCanAccessDashboardPage } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
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
  messageCount: number;
  awaitingReply: boolean;
  tag: MailTagItem | null;
};

export type MailThreadDetail = {
  id: string;
  subject: string;
  status: string;
  aliasAddress: string;
  aliasId: string;
  lastMessageAt: string;
  isUnread: boolean;
  folder: string;
  archivedAt: string | null;
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
  messages: Array<{
    id: string;
    direction: string;
    fromAddress: string;
    toAddresses: string[];
    ccAddresses: string[];
    bodyText: string | null;
    bodyHtml: string | null;
    sentAt: string;
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
  sentAt: true
} as const;

function previewText(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/\s+/g, ' ').trim().slice(0, 180) || null;
}

function compactMailBodies(message: {
  bodyHtml: string | null;
  bodyText: string | null;
}): { bodyHtml: string | null; bodyText: string | null } {
  if (message.bodyHtml) {
    return { bodyHtml: message.bodyHtml, bodyText: null };
  }
  return { bodyHtml: null, bodyText: message.bodyText };
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

export async function getMailInboxes(): Promise<MailInboxOption[]> {
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

  const [aliases, unreadThreads] = await Promise.all([
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
            providerPresetId: true
          }
        }
      }
    }),
    // Same unread rule as getMailUnreadCount, grouped per inbox.
    prisma.mailThread.findMany({
      where: {
        organizationId,
        isUnread: true,
        ...INBOX_ACTIVE_WHERE,
        alias: aliasWhere
      },
      select: {
        aliasId: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { direction: true }
        }
      }
    })
  ]);

  if (aliases.length === 0) return [];

  const unreadByAlias = new Map<string, number>();
  for (const thread of unreadThreads) {
    if (thread.messages[0]?.direction !== 'INBOUND') continue;
    unreadByAlias.set(
      thread.aliasId,
      (unreadByAlias.get(thread.aliasId) ?? 0) + 1
    );
  }

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
      providerName: preset?.name ?? alias.connection.provider
    };
  });
}

export async function getMailUnreadCount(): Promise<number> {
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

  // Unopened = flagged unread AND still waiting on an inbound (no reply yet).
  const threads = await prisma.mailThread.findMany({
    where: {
      organizationId,
      isUnread: true,
      ...INBOX_ACTIVE_WHERE,
      ...(scopedAliasIds ? { aliasId: scopedAliasIds } : {})
    },
    select: {
      id: true,
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { direction: true }
      }
    }
  });

  return threads.filter((thread) => thread.messages[0]?.direction === 'INBOUND')
    .length;
}

export async function getMailThreads(options?: {
  assignedToCurrentUser?: boolean;
  folder?: MailListFolder;
  aliasId?: string | null;
  connectionId?: string | null;
  unreadOnly?: boolean;
  status?: 'OPEN' | 'PENDING' | 'RESOLVED' | 'SNOOZED';
  tagId?: string | null;
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
    orderBy: { lastMessageAt: 'desc' },
    take: 200,
    select: {
      id: true,
      subject: true,
      status: true,
      isUnread: true,
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
          bodyText: true,
          direction: true,
          sentAt: true
        }
      }
    }
  });

  const mapped = threads.map((thread) => {
    const latest = thread.messages[0];
    const from = parseFromDisplay(latest?.fromAddress ?? null);
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
      messageCount: thread._count.messages,
      awaitingReply,
      tag: thread.tags[0]?.tag ?? null
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
      void prisma.mailThread.updateMany({
        where: { id: { in: staleOpenedIds } },
        data: { isUnread: false }
      });
    });
  }

  if (options?.unreadOnly) {
    return mapped.filter((thread) => thread.isUnread);
  }

  return mapped;
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

    const [thread, latestBodies, olderHeaders] = await Promise.all([
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
          bodyHtml: true
        }
      }),
      prisma.mailMessage.findMany({
        where: messageWhere,
        orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
        skip: MAIL_THREAD_OPEN_BODIES,
        take: MAIL_THREAD_MESSAGE_CAP - MAIL_THREAD_OPEN_BODIES,
        select: mailMessageHeaderSelect
      })
    ]);

    if (!thread) return null;

    const olderMessages = olderHeaders.toReversed().map((message) => ({
      id: message.id,
      direction: message.direction,
      fromAddress: message.fromAddress,
      toAddresses: message.toAddresses,
      ccAddresses: message.ccAddresses,
      bodyText: null,
      bodyHtml: null,
      sentAt: message.sentAt.toISOString()
    }));
    const openMessages = latestBodies.toReversed().map((message) => {
      const bodies = compactMailBodies(message);
      return {
        id: message.id,
        direction: message.direction,
        fromAddress: message.fromAddress,
        toAddresses: message.toAddresses,
        ccAddresses: message.ccAddresses,
        bodyText: bodies.bodyText,
        bodyHtml: bodies.bodyHtml,
        sentAt: message.sentAt.toISOString()
      };
    });
    const messages = [...olderMessages, ...openMessages];
    const latest = messages[messages.length - 1];
    const awaitingReply = latest?.direction === 'INBOUND';

    return {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      aliasAddress: thread.alias.address,
      aliasId: thread.alias.id,
      lastMessageAt: thread.lastMessageAt.toISOString(),
      isUnread: Boolean(thread.isUnread && awaitingReply),
      folder: thread.folder,
      archivedAt: thread.archivedAt?.toISOString() ?? null,
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
    select: { id: true, bodyText: true, bodyHtml: true }
  });

  return rows.map((row) => ({
    id: row.id,
    ...compactMailBodies(row)
  }));
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
  lastSyncedAt: string | null;
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
      lastSyncedAt: true,
      imapHost: true,
      smtpHost: true,
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
      lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null
    };
  });
}
