import 'server-only';

import { revalidatePath } from 'next/cache';
import {
  MailMessageDirection,
  MailThreadFolder,
  MailThreadStatus
} from '@prisma/client';

import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { composeDraftTitle } from '@/lib/inbox/compose-draft';

export type SaveMailboxDraftResult = {
  threadId: string;
  href: string;
};

function normalizeDraftRecipient(value: string): string {
  return value.trim().slice(0, 255);
}

export async function saveMailboxDraft(input: {
  organizationId: string;
  actorUserId: string;
  aliasId: string;
  to: string;
  subject: string;
  body: string;
  draftThreadId?: string;
}): Promise<SaveMailboxDraftResult> {
  const alias = await prisma.mailAlias.findFirst({
    where: {
      id: input.aliasId,
      organizationId: input.organizationId,
      enabled: true
    },
    select: { id: true, address: true }
  });

  if (!alias) {
    throw new Error('Alias not found');
  }

  const toAddress = normalizeDraftRecipient(input.to);
  const subject = composeDraftTitle(input.subject);
  const body = input.body.trim();
  const now = new Date();
  const fromAddress = alias.address.trim().toLowerCase();

  const existing =
    input.draftThreadId != null
      ? await prisma.mailThread.findFirst({
          where: {
            id: input.draftThreadId,
            organizationId: input.organizationId,
            folder: MailThreadFolder.DRAFT
          },
          select: {
            id: true,
            messages: {
              orderBy: { sentAt: 'desc' },
              take: 1,
              select: { id: true }
            }
          }
        })
      : null;

  if (existing) {
    const messageId = existing.messages[0]?.id;
    await prisma.$transaction([
      prisma.mailThread.update({
        where: { id: existing.id },
        data: {
          aliasId: alias.id,
          subject,
          lastMessageAt: now,
          isUnread: false,
          archivedAt: null,
          trashedAt: null,
          assigneeKind: 'HUMAN',
          assigneeId: input.actorUserId
        }
      }),
      messageId
        ? prisma.mailMessage.update({
            where: { id: messageId },
            data: {
              fromAddress,
              toAddresses: toAddress ? [toAddress] : [],
              bodyText: body || null,
              sentAt: now
            }
          })
        : prisma.mailMessage.create({
            data: {
              threadId: existing.id,
              providerMessageId: `draft-msg-${crypto.randomUUID()}`.slice(
                0,
                512
              ),
              direction: MailMessageDirection.OUTBOUND,
              fromAddress,
              toAddresses: toAddress ? [toAddress] : [],
              ccAddresses: [],
              bodyText: body || null,
              sentAt: now
            }
          })
    ]);

    revalidateDraftPaths(existing.id);
    return {
      threadId: existing.id,
      href: inboxThreadRoute(existing.id)
    };
  }

  const thread = await prisma.mailThread.create({
    data: {
      organizationId: input.organizationId,
      aliasId: alias.id,
      providerThreadId: `draft-${crypto.randomUUID()}`.slice(0, 512),
      subject,
      status: MailThreadStatus.OPEN,
      isUnread: false,
      folder: MailThreadFolder.DRAFT,
      lastMessageAt: now,
      assigneeKind: 'HUMAN',
      assigneeId: input.actorUserId,
      messages: {
        create: {
          providerMessageId: `draft-msg-${crypto.randomUUID()}`.slice(0, 512),
          direction: MailMessageDirection.OUTBOUND,
          fromAddress,
          toAddresses: toAddress ? [toAddress] : [],
          ccAddresses: [],
          bodyText: body || null,
          sentAt: now
        }
      }
    },
    select: { id: true }
  });

  revalidateDraftPaths(thread.id);
  return {
    threadId: thread.id,
    href: inboxThreadRoute(thread.id)
  };
}

function revalidateDraftPaths(threadId: string): void {
  revalidatePath(Routes.InboxDrafts);
  revalidatePath(Routes.InboxAll);
  revalidatePath(inboxThreadRoute(threadId));
}
