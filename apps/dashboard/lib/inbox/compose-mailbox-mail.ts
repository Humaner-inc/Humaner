import 'server-only';

import { revalidatePath } from 'next/cache';
import {
  MailMessageDirection,
  MailProvider,
  MailThreadStatus
} from '@prisma/client';

import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { sendMailboxMail } from '@/lib/inbox/send-mailbox-mail';
import { sendOutboundMail } from '@/lib/inbox/send-outbound-mail';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

function normalizeAddress(value: string): string {
  const trimmed = value.trim();
  const bracketed = trimmed.match(/<([^<>]+)>/);
  return (bracketed?.[1] ?? trimmed).trim().toLowerCase();
}

export function isMailboxAddress(value: string): boolean {
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
}

export type ComposeMailboxMailResult = {
  threadId: string;
  messageId: string;
  href: string;
};

export async function composeMailboxMail(input: {
  organizationId: string;
  actorUserId: string;
  aliasId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<ComposeMailboxMailResult> {
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
          provider: true,
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
    throw new Error('Alias not found');
  }

  const connection = alias.connection;
  const fromAddress = normalizeAddress(alias.address);
  const toAddress = normalizeAddress(input.to);

  if (!isMailboxAddress(toAddress)) {
    throw new Error('Enter a valid email address.');
  }

  let messageId: string;
  let providerThreadId: string;

  if (connection.provider === MailProvider.GMAIL) {
    try {
      const sent = await sendMailboxMail({
        provider: MailProvider.GMAIL,
        connectionId: connection.id,
        from: fromAddress,
        to: [toAddress],
        subject: input.subject,
        text: input.body
      });
      messageId = sent.messageId;
      providerThreadId = (sent.threadId ?? `outbound-${messageId}`).slice(
        0,
        512
      );
    } catch (error) {
      const detail =
        error instanceof Error && error.message
          ? error.message
          : 'Reconnect Gmail and try again.';
      throw new Error(`Could not send this email. ${detail}`);
    }
  } else {
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
      throw new Error('This mailbox is missing SMTP credentials for sending.');
    }

    const validated = await validateMailEndpoints({
      imapHost,
      imapPort: connection.imapPort,
      smtpHost,
      smtpPort: connection.smtpPort
    });

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
        subject: input.subject,
        text: input.body
      });
      messageId = sent.messageId;
      providerThreadId = `outbound-${messageId}`.slice(0, 512);
    } catch (error) {
      const detail =
        error instanceof Error && error.message
          ? error.message
          : 'Check SMTP settings and try again.';
      throw new Error(`Could not send this email. ${detail}`);
    }
  }

  const sentAt = new Date();
  const thread = await prisma.mailThread.create({
    data: {
      organizationId: input.organizationId,
      aliasId: alias.id,
      providerThreadId,
      subject: input.subject,
      status: MailThreadStatus.OPEN,
      isUnread: false,
      lastMessageAt: sentAt,
      assigneeKind: 'HUMAN',
      assigneeId: input.actorUserId,
      messages: {
        create: {
          providerMessageId: messageId.slice(0, 512),
          direction: MailMessageDirection.OUTBOUND,
          fromAddress,
          toAddresses: [toAddress],
          ccAddresses: [],
          bodyText: input.body,
          sentAt
        }
      }
    },
    select: { id: true }
  });

  revalidatePath(Routes.InboxAll);
  revalidatePath(Routes.InboxAssigned);
  revalidatePath(inboxThreadRoute(thread.id));

  return {
    threadId: thread.id,
    messageId,
    href: inboxThreadRoute(thread.id)
  };
}
