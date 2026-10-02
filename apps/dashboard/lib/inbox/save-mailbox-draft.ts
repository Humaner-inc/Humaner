import 'server-only';

import { revalidatePath } from 'next/cache';
import {
  MailMessageDirection,
  MailProvider,
  MailThreadFolder,
  MailThreadStatus
} from '@prisma/client';

import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { composeDraftTitle } from '@/lib/inbox/compose-draft';
import { humanizeMailboxActionError } from '@/lib/inbox/gmail-sync-errors';
import {
  createGmailDraft,
  findGmailDraftIdByMessageId,
  updateGmailDraft
} from '@/lib/inbox/gmail/api';
import { getGmailAccessToken } from '@/lib/inbox/gmail/tokens';

export type SaveMailboxDraftResult = {
  threadId: string;
  href: string;
};

function normalizeDraftRecipient(value: string): string {
  return value.trim().slice(0, 255);
}

function isSyntheticDraftThreadId(value: string): boolean {
  return /^(draft-|outbound-)/i.test(value.trim());
}

function isSyntheticDraftMessageId(value: string): boolean {
  return /^draft-msg-/i.test(value.trim());
}

async function syncDraftToGmail(input: {
  connectionId: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  existingProviderThreadId?: string;
  existingProviderMessageId?: string;
}): Promise<{ providerThreadId: string; providerMessageId: string }> {
  const accessToken = await getGmailAccessToken(input.connectionId);
  const payload = {
    from: input.from,
    to: input.to ? [input.to] : [],
    subject: input.subject,
    text: input.text || ' ',
    ...(input.html ? { html: input.html } : {})
  };

  const existingMessageId = input.existingProviderMessageId?.trim();
  const canUpdate =
    existingMessageId &&
    !isSyntheticDraftMessageId(existingMessageId) &&
    input.existingProviderThreadId &&
    !isSyntheticDraftThreadId(input.existingProviderThreadId);

  if (canUpdate) {
    const draftId = await findGmailDraftIdByMessageId(
      accessToken,
      existingMessageId
    );
    if (draftId) {
      try {
        const updated = await updateGmailDraft(accessToken, draftId, payload);
        return {
          providerThreadId: updated.threadId.slice(0, 512),
          providerMessageId: updated.messageId.slice(0, 512)
        };
      } catch (error) {
        // Draft may have been deleted in Gmail — fall through to create.
        if (!/notFound|404/i.test(String(error))) {
          throw error;
        }
      }
    }
  }

  const created = await createGmailDraft(accessToken, payload);
  return {
    providerThreadId: created.threadId.slice(0, 512),
    providerMessageId: created.messageId.slice(0, 512)
  };
}

export async function saveMailboxDraft(input: {
  organizationId: string;
  actorUserId: string;
  aliasId: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  draftThreadId?: string;
}): Promise<SaveMailboxDraftResult> {
  const alias = await prisma.mailAlias.findFirst({
    where: {
      id: input.aliasId,
      organizationId: input.organizationId,
      enabled: true
    },
    select: {
      id: true,
      address: true,
      connection: {
        select: {
          id: true,
          provider: true
        }
      }
    }
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
            providerThreadId: true,
            messages: {
              orderBy: { sentAt: 'desc' },
              take: 1,
              select: { id: true, providerMessageId: true }
            }
          }
        })
      : null;

  let providerThreadId =
    existing?.providerThreadId ?? `draft-${crypto.randomUUID()}`.slice(0, 512);
  let providerMessageId =
    existing?.messages[0]?.providerMessageId ??
    `draft-msg-${crypto.randomUUID()}`.slice(0, 512);

  if (alias.connection.provider === MailProvider.GMAIL) {
    try {
      const synced = await syncDraftToGmail({
        connectionId: alias.connection.id,
        from: fromAddress,
        to: toAddress,
        subject,
        text: body,
        html: input.bodyHtml,
        existingProviderThreadId: existing?.providerThreadId,
        existingProviderMessageId: existing?.messages[0]?.providerMessageId
      });
      providerThreadId = synced.providerThreadId;
      providerMessageId = synced.providerMessageId;
    } catch (error) {
      throw new Error(
        humanizeMailboxActionError(
          error,
          'Could not save this draft to Gmail. Try again.'
        )
      );
    }
  }

  if (existing) {
    const messageId = existing.messages[0]?.id;
    await prisma.$transaction([
      prisma.mailThread.update({
        where: { id: existing.id },
        data: {
          aliasId: alias.id,
          providerThreadId,
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
              providerMessageId,
              fromAddress,
              toAddresses: toAddress ? [toAddress] : [],
              bodyText: body || null,
              bodyHtml: input.bodyHtml ?? null,
              sentAt: now
            }
          })
        : prisma.mailMessage.create({
            data: {
              threadId: existing.id,
              providerMessageId,
              direction: MailMessageDirection.OUTBOUND,
              fromAddress,
              toAddresses: toAddress ? [toAddress] : [],
              ccAddresses: [],
              bodyText: body || null,
              bodyHtml: input.bodyHtml ?? null,
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
      providerThreadId,
      subject,
      status: MailThreadStatus.OPEN,
      isUnread: false,
      folder: MailThreadFolder.DRAFT,
      lastMessageAt: now,
      assigneeKind: 'HUMAN',
      assigneeId: input.actorUserId,
      messages: {
        create: {
          providerMessageId,
          direction: MailMessageDirection.OUTBOUND,
          fromAddress,
          toAddresses: toAddress ? [toAddress] : [],
          ccAddresses: [],
          bodyText: body || null,
          bodyHtml: input.bodyHtml ?? null,
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
