import 'server-only';

import nodemailer from 'nodemailer';

import type { ImapSmtpEndpoints } from '@/lib/inbox/test-imap-smtp';

export type OutboundMailInput = {
  endpoints: ImapSmtpEndpoints;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string;
};

function normalizeMailbox(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const bracketed = trimmed.match(/<([^<>]+)>/);
  return (bracketed?.[1] ?? trimmed).replace(/^<|>$/g, '').trim();
}

function formatMessageId(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const bare = value.trim().replace(/^<|>$/g, '');
  return `<${bare}>`;
}

function formatReferences(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => formatMessageId(part)!)
    .join(' ');
}

export async function sendOutboundMail(
  input: OutboundMailInput
): Promise<{ messageId: string; accepted: string[] }> {
  const authUser =
    input.endpoints.smtpUser?.trim() || input.endpoints.email.trim();
  const fromAddress = normalizeMailbox(input.from);
  const toAddresses = input.to.map(normalizeMailbox).filter(Boolean);

  if (toAddresses.length === 0) {
    throw new Error('No recipients to send to.');
  }

  const transporter = nodemailer.createTransport({
    host: input.endpoints.smtpHost,
    port: input.endpoints.smtpPort,
    secure:
      input.endpoints.smtpPort === 465
        ? true
        : input.endpoints.smtpTls && input.endpoints.smtpPort !== 587,
    requireTLS: input.endpoints.smtpPort === 587,
    tls: {
      servername: input.endpoints.smtpServername,
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    },
    auth: {
      user: authUser,
      pass: input.endpoints.smtpPassword || input.endpoints.password
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000
  });

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toAddresses.join(', '),
      cc: input.cc?.length
        ? input.cc.map(normalizeMailbox).join(', ')
        : undefined,
      subject: input.subject,
      text: input.text,
      inReplyTo: formatMessageId(input.inReplyTo),
      references: formatReferences(input.references),
      // Auth mailbox is the envelope sender — required by many IMAP hosts
      // when From is an alias on the same account.
      envelope: {
        from: authUser,
        to: toAddresses
      }
    });

    const accepted = (info.accepted ?? []).map((address) =>
      normalizeMailbox(String(address))
    );
    const rejected = (info.rejected ?? []).map((address) =>
      normalizeMailbox(String(address))
    );
    const acceptedAll = toAddresses.every((recipient) =>
      accepted.includes(recipient)
    );

    if (!acceptedAll || rejected.length > 0) {
      throw new Error(
        `SMTP rejected recipient${rejected.length === 1 ? '' : 's'}: ${
          rejected.join(', ') || toAddresses.join(', ')
        }`
      );
    }

    const messageId =
      typeof info.messageId === 'string' && info.messageId.trim()
        ? info.messageId.replace(/^<|>$/g, '')
        : `outbound-${Date.now()}`;

    return { messageId, accepted };
  } finally {
    transporter.close();
  }
}
