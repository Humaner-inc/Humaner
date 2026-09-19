import 'server-only';

import { MailProvider } from '@prisma/client';

import { sendGmailMessage } from '@/lib/inbox/gmail/api';
import { getGmailAccessToken } from '@/lib/inbox/gmail/tokens';
import type { MailAttachment } from '@/lib/inbox/mail-attachments';
import { sendOutboundMail } from '@/lib/inbox/send-outbound-mail';
import type { ImapSmtpEndpoints } from '@/lib/inbox/test-imap-smtp';

export async function sendMailboxMail(input: {
  provider: MailProvider;
  connectionId: string;
  endpoints?: ImapSmtpEndpoints;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  attachments?: MailAttachment[];
  inReplyTo?: string;
  references?: string;
  providerThreadId?: string;
}): Promise<{ messageId: string; threadId?: string }> {
  if (input.provider === MailProvider.GMAIL) {
    const accessToken = await getGmailAccessToken(input.connectionId);
    const sent = await sendGmailMessage(
      accessToken,
      {
        from: input.from,
        to: input.to,
        cc: input.cc,
        subject: input.subject,
        text: input.text,
        attachments: input.attachments,
        inReplyTo: input.inReplyTo,
        references: input.references
      },
      input.providerThreadId
    );
    return { messageId: sent.id, threadId: sent.threadId };
  }

  if (!input.endpoints) {
    throw new Error('This mailbox is missing SMTP credentials for sending.');
  }

  const sent = await sendOutboundMail({
    endpoints: input.endpoints,
    from: input.from,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    text: input.text,
    attachments: input.attachments,
    inReplyTo: input.inReplyTo,
    references: input.references
  });

  return { messageId: sent.messageId };
}
