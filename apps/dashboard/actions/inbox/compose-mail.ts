'use server';

import { revalidatePath } from 'next/cache';
import { MailMessageDirection, MailThreadStatus } from '@prisma/client';

import { pageActionClient } from '@/actions/safe-action';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { resolveMailAliasScope } from '@/lib/inbox/mail-alias-scope';
import { sendOutboundMail } from '@/lib/inbox/send-outbound-mail';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';
import {
  NotFoundError,
  PreConditionError,
  RateLimitExceededError,
  ValidationError
} from '@/lib/validation/exceptions';
import { composeMailSchema } from '@/schemas/inbox/compose-mail-schema';

const composeLimiter = rateLimit({ intervalInMs: 15 * 60 * 1000 });

function normalizeAddress(value: string): string {
  const trimmed = value.trim();
  const bracketed = trimmed.match(/<([^<>]+)>/);
  return (bracketed?.[1] ?? trimmed).trim().toLowerCase();
}

export const composeMail = pageActionClient('inbox')
  .metadata({ actionName: 'composeMail' })
  .schema(composeMailSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    let distributedAttempts = 0;
    try {
      distributedAttempts = await incrementRateLimit(
        `rate-limit:mailbox-compose:${organizationId}`,
        15 * 60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      composeLimiter.check(30, `mailbox-compose:${session.user.id}`)
        .isRateLimited;
    if (distributedAttempts > 40 || locallyRateLimited) {
      throw new RateLimitExceededError();
    }

    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });
    if (
      scope.type === 'ids' &&
      (scope.aliasIds.length === 0 ||
        !scope.aliasIds.includes(parsedInput.aliasId))
    ) {
      throw new NotFoundError('Alias not found');
    }

    const alias = await prisma.mailAlias.findFirst({
      where: {
        id: parsedInput.aliasId,
        organizationId,
        enabled: true
      },
      select: {
        id: true,
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
    });

    if (!alias) {
      throw new ValidationError('Alias not found');
    }

    const connection = alias.connection;
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

    const fromAddress = normalizeAddress(alias.address);
    const toAddress = normalizeAddress(parsedInput.to);

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
        to: [toAddress],
        subject: parsedInput.subject,
        text: parsedInput.body
      });
      messageId = sent.messageId;
    } catch (error) {
      const detail =
        error instanceof Error && error.message
          ? error.message
          : 'Check SMTP settings and try again.';
      throw new ValidationError(`Could not send this email. ${detail}`);
    }

    const sentAt = new Date();
    const providerThreadId = `outbound-${messageId}`.slice(0, 512);

    const thread = await prisma.mailThread.create({
      data: {
        organizationId,
        aliasId: alias.id,
        providerThreadId,
        subject: parsedInput.subject,
        status: MailThreadStatus.OPEN,
        isUnread: false,
        lastMessageAt: sentAt,
        assigneeId: session.user.id,
        messages: {
          create: {
            providerMessageId: messageId.slice(0, 512),
            direction: MailMessageDirection.OUTBOUND,
            fromAddress,
            toAddresses: [toAddress],
            ccAddresses: [],
            bodyText: parsedInput.body,
            sentAt
          }
        }
      },
      select: { id: true }
    });

    revalidatePath(Routes.InboxAll);
    revalidatePath(Routes.InboxAssigned);
    revalidatePath(inboxThreadRoute(thread.id));

    return { threadId: thread.id, messageId };
  });
