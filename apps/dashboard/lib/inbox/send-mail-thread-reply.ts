import 'server-only';

import { MailMessageDirection, MailProvider } from '@prisma/client';

import { workspaceAllowsCompanionAction } from '@/data/inbox/companion-rights';
import { prisma } from '@/lib/db/prisma';
import type { MailAttachment } from '@/lib/inbox/mail-attachments';
import { applyMailboxSignature } from '@/lib/inbox/mailbox-signature';
import { sendMailboxMail } from '@/lib/inbox/send-mailbox-mail';
import { sendOutboundMail } from '@/lib/inbox/send-outbound-mail';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

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

export async function sendMailThreadReply(input: {
  threadId: string;
  organizationId: string;
  body: string;
  bodyHtml?: string;
  attachments?: MailAttachment[];
  aliasId?: string;
}): Promise<{ messageId: string }> {
  const thread = await prisma.mailThread.findFirst({
    where: { id: input.threadId, organizationId: input.organizationId },
    select: {
      id: true,
      subject: true,
      providerThreadId: true,
      alias: {
        select: {
          id: true,
          address: true,
          connectionId: true,
          companionPolicy: true,
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
              imapTls: true,
              signatureText: true,
              signatureIconData: true,
              signatureIconContentType: true
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
    throw new Error('Thread not found');
  }

  const connection = thread.alias.connection;
  const lastInbound = [...thread.messages]
    .reverse()
    .find((message) => message.direction === MailMessageDirection.INBOUND);
  const toAddresses = lastInbound
    ? [normalizeAddress(lastInbound.fromAddress)]
    : [];

  if (toAddresses.length === 0 || !toAddresses.every(isMailboxAddress)) {
    throw new Error('No inbound sender to reply to.');
  }

  let fromAddress = normalizeAddress(thread.alias.address);
  if (input.aliasId && input.aliasId !== thread.alias.id) {
    const sendAlias = await prisma.mailAlias.findFirst({
      where: {
        id: input.aliasId,
        organizationId: input.organizationId,
        enabled: true,
        connectionId: thread.alias.connectionId
      },
      select: { address: true }
    });
    if (!sendAlias) {
      throw new Error('That alias is not on this mailbox.');
    }
    fromAddress = normalizeAddress(sendAlias.address);
  }

  const references = thread.messages
    .map((message) => message.providerMessageId)
    .filter(Boolean)
    .join(' ');

  const signed = await applyMailboxSignature(
    input.body,
    {
      text: connection.signatureText,
      icon:
        connection.signatureIconData && connection.signatureIconContentType
          ? {
              data: Buffer.from(connection.signatureIconData),
              contentType: connection.signatureIconContentType
            }
          : null
    },
    { bodyHtml: input.bodyHtml }
  );
  const outboundAttachments = [
    ...(input.attachments ?? []),
    ...(signed.inlineIcon ? [signed.inlineIcon] : [])
  ];

  let messageId: string;
  if (connection.provider === MailProvider.GMAIL) {
    const sent = await sendMailboxMail({
      provider: MailProvider.GMAIL,
      connectionId: connection.id,
      from: fromAddress,
      to: toAddresses,
      subject: replySubject(thread.subject),
      text: signed.text,
      html: signed.html,
      attachments: outboundAttachments,
      inReplyTo: lastInbound?.providerMessageId,
      references: references || undefined,
      providerThreadId: thread.providerThreadId.startsWith('outbound-')
        ? undefined
        : thread.providerThreadId
    });
    messageId = sent.messageId;
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
      text: signed.text,
      html: signed.html,
      attachments: outboundAttachments,
      inReplyTo: lastInbound?.providerMessageId,
      references: references || undefined
    });
    messageId = sent.messageId;
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
        bodyText: signed.text,
        bodyHtml: signed.html ?? null,
        sentAt
      }
    }),
    prisma.mailThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: sentAt,
        isUnread: false
      }
    })
  ]);

  return { messageId };
}

export async function aliasAllowsCompanionSend(
  organizationId: string,
  threadId: string
): Promise<boolean> {
  const allowed = await workspaceAllowsCompanionAction(organizationId, 'SEND');
  if (!allowed) return false;

  const thread = await prisma.mailThread.findFirst({
    where: { id: threadId, organizationId },
    select: { id: true }
  });
  return Boolean(thread);
}
