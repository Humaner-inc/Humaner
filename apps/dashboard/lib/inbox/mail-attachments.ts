import {
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MAX_COUNT,
  type ChatAttachmentPayload
} from '@humaner/shared/chat-attachments';
import { z } from 'zod';

/** Files riding on an outbound email (base64 payload). */
export type MailAttachment = {
  name: string;
  mediaType: string;
  data: string;
  /** When set, the part is inline (e.g. signature logo via cid:). */
  cid?: string;
};

export const MAIL_ATTACHMENT_MAX_COUNT = CHAT_ATTACHMENT_MAX_COUNT;

/** Base64 inflates ~4/3 over the raw byte cap. */
const MAX_BASE64_CHARS = Math.ceil(CHAT_ATTACHMENT_MAX_BYTES * 1.4) + 8;

export const mailAttachmentSchema = z.object({
  name: z.string().trim().min(1).max(255),
  mediaType: z.string().trim().min(3).max(100),
  data: z.string().min(1).max(MAX_BASE64_CHARS)
});

export const mailAttachmentListSchema = z
  .array(mailAttachmentSchema)
  .max(MAIL_ATTACHMENT_MAX_COUNT);

function base64FromUtf8(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('base64');
  }
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Chat uploads (Companion composer) → sendable mail attachments.
 * Skipped-file placeholders ("[Could not include …]") are dropped.
 */
export function chatAttachmentToMailAttachment(
  attachment: ChatAttachmentPayload
): MailAttachment | null {
  if (attachment.kind === 'image' || attachment.kind === 'document') {
    return {
      name: attachment.name,
      mediaType: attachment.mediaType,
      data: attachment.data
    };
  }
  if (attachment.text.startsWith('[Could not include')) {
    return null;
  }
  return {
    name: attachment.name,
    mediaType: attachment.mediaType || 'text/plain',
    data: base64FromUtf8(attachment.text)
  };
}

export function chatAttachmentsToMailAttachments(
  attachments: ChatAttachmentPayload[]
): MailAttachment[] {
  const result: MailAttachment[] = [];
  for (const attachment of attachments) {
    const mail = chatAttachmentToMailAttachment(attachment);
    if (mail) {
      result.push(mail);
    }
  }
  return result.slice(0, MAIL_ATTACHMENT_MAX_COUNT);
}
