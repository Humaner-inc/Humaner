import 'server-only';

import { MailProvider } from '@prisma/client';

import {
  findGmailDraftIdByMessageId,
  getGmailAccessToken,
  isGmailQuotaError,
  sendGmailDraft,
  sendGmailMessage,
  sleep,
  updateGmailDraft
} from '@/lib/inbox/gmail-bridge';
import { humanizeMailboxActionError } from '@/lib/inbox/gmail-sync-errors';
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
  html?: string;
  attachments?: MailAttachment[];
  inReplyTo?: string;
  references?: string;
  providerThreadId?: string;
  /** When set, try `drafts.send` so the Gmail Drafts copy is removed. */
  gmailDraftMessageId?: string;
}): Promise<{ messageId: string; threadId?: string }> {
  if (input.provider === MailProvider.GMAIL) {
    const accessToken = await getGmailAccessToken(input.connectionId);
    const payload = {
      from: input.from,
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
      inReplyTo: input.inReplyTo,
      references: input.references
    };

    const sendOnce = async (): Promise<{
      messageId: string;
      threadId?: string;
    }> => {
      const draftMessageId = input.gmailDraftMessageId?.trim();
      if (draftMessageId && !draftMessageId.startsWith('draft-msg-')) {
        const draftId = await findGmailDraftIdByMessageId(
          accessToken,
          draftMessageId
        );
        if (draftId) {
          await updateGmailDraft(accessToken, draftId, payload);
          const sent = await sendGmailDraft(accessToken, draftId);
          return { messageId: sent.id, threadId: sent.threadId };
        }
      }
      const sent = await sendGmailMessage(
        accessToken,
        payload,
        input.providerThreadId
      );
      return { messageId: sent.id, threadId: sent.threadId };
    };

    try {
      return await sendOnce();
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      // One short retry — sync may have just burned the minute budget.
      if (isGmailQuotaError(raw)) {
        await sleep(2500);
        try {
          return await sendOnce();
        } catch (retryError) {
          throw new Error(
            humanizeMailboxActionError(
              retryError,
              'Reconnect Gmail and try again.'
            )
          );
        }
      }
      throw new Error(
        humanizeMailboxActionError(error, 'Reconnect Gmail and try again.')
      );
    }
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
    html: input.html,
    attachments: input.attachments,
    inReplyTo: input.inReplyTo,
    references: input.references
  });

  return { messageId: sent.messageId };
}
