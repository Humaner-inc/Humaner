import type { ChatAttachmentPayload } from '@humaner/shared/chat-attachments';

export type TeamMessageAttachment = ChatAttachmentPayload;

export function teamAttachmentHref(attachment: TeamMessageAttachment): string {
  if (attachment.kind === 'text') {
    return `data:${attachment.mediaType};charset=utf-8,${encodeURIComponent(attachment.text)}`;
  }
  return `data:${attachment.mediaType};base64,${attachment.data}`;
}

export function filesFromClipboard(
  event: Pick<ClipboardEvent, 'clipboardData'>
): File[] {
  const files: File[] = [];
  const items = event.clipboardData?.items;
  if (items) {
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  if (files.length === 0 && event.clipboardData?.files?.length) {
    files.push(...Array.from(event.clipboardData.files));
  }
  return files.filter((file) => file.type.startsWith('image/'));
}
