import 'server-only';

import {
  getNeonObject,
  isNeonObjectStorageConfigured,
  putNeonObject
} from '@/lib/storage/neon-s3';

/** Neon Object Storage bucket for inbound mail attachments (private). */
export const MAIL_STORAGE_BUCKET =
  process.env.MAIL_STORAGE_BUCKET?.trim() || 'mail';

/** Largest single inbound attachment we persist. Oversized parts are skipped. */
export const MAIL_ATTACHMENT_MAX_STORED_BYTES = 15 * 1024 * 1024;

export function isMailAttachmentStorageConfigured(): boolean {
  return isNeonObjectStorageConfigured();
}

/** Object key for an inbound attachment inside the `mail` bucket. */
export function mailAttachmentObjectKey(input: {
  organizationId: string;
  messageId: string;
  attachmentId: string;
}): string {
  return `attachments/${input.organizationId}/${input.messageId}/${input.attachmentId}`;
}

export async function uploadMailAttachment(input: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<boolean> {
  if (!isMailAttachmentStorageConfigured()) {
    return false;
  }
  try {
    await putNeonObject({
      bucket: MAIL_STORAGE_BUCKET,
      key: input.key,
      body: input.body,
      contentType: input.contentType
    });
    return true;
  } catch (error) {
    console.error('[inbox] Mail attachment upload failed', error);
    return false;
  }
}

export async function readMailAttachment(
  key: string
): Promise<{ body: Buffer; contentType: string | null } | null> {
  if (!isMailAttachmentStorageConfigured()) {
    return null;
  }
  return getNeonObject({ bucket: MAIL_STORAGE_BUCKET, key });
}
