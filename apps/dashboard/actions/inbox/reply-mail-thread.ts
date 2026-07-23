'use server';

import { revalidatePath } from 'next/cache';
import { MailMessageDirection } from '@prisma/client';

import { pageActionClient } from '@/actions/safe-action';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { sendOutboundMail } from '@/lib/inbox/send-outbound-mail';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';
import {
  PreConditionError,
  RateLimitExceededError,
  ValidationError
} from '@/lib/validation/exceptions';
import { replyMailThreadSchema } from '@/schemas/inbox/reply-mail-schema';

const replyLimiter = rateLimit({ intervalInMs: 15 * 60 * 1000 });

function normalizeAddress(value: string): string {
  const trimmed = value.trim();
  const bracketed = trimmed.match(/<([^<>]+)>/);
  return (bracketed?.[1] ?? trimmed).trim().toLowerCase();
}

function isMailboxAddress(value: string): boolean {
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
}

function replySubject(subject: string): string {
  const trimmed = subject.trim() || '(No subject)';
  return /^re:\s/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export const replyMailThread = pageActionClient('inbox')
  .metadata({ actionName: 'replyMailThread' })
  .schema(replyMailThreadSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    let distributedAttempts = 0;
    try {
      distributedAttempts = await incrementRateLimit(
        `rate-limit:mailbox-reply:${organizationId}`,
        15 * 60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      replyLimiter.check(30, `mailbox-reply:${session.user.id}`).isRateLimited;
    if (distributedAttempts > 40 || locallyRateLimited) {
      throw new RateLimitExceededError();
    }

    const thread = await prisma.mailThread.findFirst({
      where: {
        id: parsedInput.threadId,
        organizationId,
        alias: {
          members: {
            some: { userId: session.user.id }
          }
        }
      },
      select: {
        id: true,
        subject: true,
        providerThreadId: true,
        alias: {
          select: {
            address: true,
            connection: {
              select: {
                email: true,
                imapHost: true,
                imapPort: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpPassword: true,
                smtpTls: true,
                imapPassword: true,
                imapTls: true
              }
            }
          }
        },
        messages: {
          orderBy: { sentAt: 'asc' },
          take: 50,
          select: {
            providerMessageId: true,
            direction: true,
            fromAddress: true,
            toAddresses: true
          }
        }
      }
    });

    if (!thread) {
      throw new ValidationError('Thread not found');
    }

    const connection = thread.alias.connection;
    const smtpHost = decryptSensitiveField(connection.smtpHost);
    const smtpUser = decryptSensitiveField(connection.smtpUser);
    const smtpPassword = decryptSensitiveField(connection.smtpPassword);
    const imapHost = decryptSensitiveField(connection.imapHost);
    const imapPassword = decryptSensitiveField(connection.imapPassword);

    if (
      !smtpHost ||
      !smtpPassword ||
      !connection.smtpPort ||
      !imapHost ||
      !connection.imapPort
    ) {
      throw new ValidationError(
        'This mailbox is missing SMTP credentials for sending.'
      );
    }

    const validated = await validateMailEndpoints({
      imapHost,
      imapPort: connection.imapPort,
      smtpHost,
      smtpPort: connection.smtpPort
    });

    const lastInbound = [...thread.messages]
      .reverse()
      .find((message) => message.direction === MailMessageDirection.INBOUND);
    const toAddresses = lastInbound
      ? [normalizeAddress(lastInbound.fromAddress)]
      : [];

    if (toAddresses.length === 0 || !toAddresses.every(isMailboxAddress)) {
      throw new ValidationError('No inbound sender to reply to.');
    }

    const fromAddress = normalizeAddress(thread.alias.address);
    const references = thread.messages
      .map((message) => message.providerMessageId)
      .filter(Boolean)
      .join(' ');

    let messageId: string;
    try {
      const sent = await sendOutboundMail({
        endpoints: {
          email: connection.email,
          password: imapPassword || smtpPassword,
          imapHost: validated.imap.address,
          imapServername: validated.imap.hostname,
          imapPort: connection.imapPort,
          imapTls: connection.imapTls,
          smtpHost: validated.smtp.address,
          smtpServername: validated.smtp.hostname,
          smtpPort: connection.smtpPort,
          smtpTls: connection.smtpTls,
          smtpUser: smtpUser || connection.email,
          smtpPassword
        },
        from: fromAddress,
        to: toAddresses,
        subject: replySubject(thread.subject),
        text: parsedInput.body,
        inReplyTo: lastInbound?.providerMessageId,
        references: references || undefined
      });
      messageId = sent.messageId;
    } catch (error) {
      const detail =
        error instanceof Error && error.message
          ? error.message
          : 'Check SMTP settings and try again.';
      throw new ValidationError(`Could not send this reply. ${detail}`);
    }

    const sentAt = new Date();
    await prisma.$transaction([
      prisma.mailMessage.create({
        data: {
          threadId: thread.id,
          providerMessageId: messageId.slice(0, 512),
          direction: MailMessageDirection.OUTBOUND,
          fromAddress,
          toAddresses,
          ccAddresses: [],
          bodyText: parsedInput.body,
          sentAt
        }
      }),
      prisma.mailThread.update({
        where: { id: thread.id },
        data: { lastMessageAt: sentAt }
      })
    ]);

    revalidatePath(Routes.InboxAll);
    revalidatePath(Routes.InboxAssigned);
    revalidatePath(inboxThreadRoute(thread.id));

    return { messageId };
  });
