import 'server-only';

import type Anthropic from '@anthropic-ai/sdk';
import {
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MAX_COUNT,
  CHAT_IMAGE_MEDIA_TYPES,
  CHAT_TEXT_ATTACHMENT_MAX_CHARS,
  type ChatAttachmentPayload,
  type ChatImageMediaType
} from '@humaner/shared/chat-attachments';

const IMAGE_TYPE_SET = new Set<string>(CHAT_IMAGE_MEDIA_TYPES);
const MAX_BASE64_CHARS = Math.ceil(CHAT_ATTACHMENT_MAX_BYTES * 1.4) + 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asTrimmedName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const name = value.trim().slice(0, 255);
  return name.length > 0 ? name : null;
}

function parseOneAttachment(raw: unknown): ChatAttachmentPayload | null {
  if (!isRecord(raw)) {
    return null;
  }
  const name = asTrimmedName(raw.name);
  if (!name) {
    return null;
  }

  if (raw.kind === 'image') {
    if (
      typeof raw.mediaType !== 'string' ||
      !IMAGE_TYPE_SET.has(raw.mediaType) ||
      typeof raw.data !== 'string' ||
      raw.data.length === 0 ||
      raw.data.length > MAX_BASE64_CHARS
    ) {
      return null;
    }
    return {
      kind: 'image',
      name,
      mediaType: raw.mediaType as ChatImageMediaType,
      data: raw.data
    };
  }

  if (raw.kind === 'document') {
    if (
      raw.mediaType !== 'application/pdf' ||
      typeof raw.data !== 'string' ||
      raw.data.length === 0 ||
      raw.data.length > MAX_BASE64_CHARS
    ) {
      return null;
    }
    return {
      kind: 'document',
      name,
      mediaType: 'application/pdf',
      data: raw.data
    };
  }

  if (raw.kind === 'text') {
    if (typeof raw.text !== 'string') {
      return null;
    }
    const text = raw.text.slice(0, CHAT_TEXT_ATTACHMENT_MAX_CHARS);
    if (!text.trim()) {
      return null;
    }
    const mediaType =
      typeof raw.mediaType === 'string' && raw.mediaType.trim()
        ? raw.mediaType.trim().slice(0, 100)
        : 'text/plain';
    return { kind: 'text', name, mediaType, text };
  }

  return null;
}

export function parseChatAttachments(raw: unknown): ChatAttachmentPayload[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const parsed: ChatAttachmentPayload[] = [];
  for (const item of raw.slice(0, CHAT_ATTACHMENT_MAX_COUNT)) {
    const attachment = parseOneAttachment(item);
    if (attachment) {
      parsed.push(attachment);
    }
  }
  return parsed;
}

export function buildStoredUserMessage(
  message: string,
  attachments: ChatAttachmentPayload[]
): string {
  const parts: string[] = [];
  const trimmed = message.trim();
  if (trimmed) {
    parts.push(trimmed);
  }
  for (const attachment of attachments) {
    if (attachment.kind === 'text') {
      parts.push(`Attached file "${attachment.name}":\n${attachment.text}`);
    } else if (attachment.kind === 'image') {
      parts.push(`Attached image: ${attachment.name}`);
    } else {
      parts.push(`Attached document: ${attachment.name}`);
    }
  }
  return parts.join('\n\n');
}

export function buildRetrievalQuery(
  message: string,
  attachments: ChatAttachmentPayload[]
): string {
  const parts = [message.trim()];
  for (const attachment of attachments) {
    if (attachment.kind === 'text') {
      parts.push(attachment.text.slice(0, 1500));
    }
  }
  return parts.filter(Boolean).join('\n').slice(0, 4000);
}

export function buildAnthropicUserContent(
  message: string,
  attachments: ChatAttachmentPayload[]
): Anthropic.ContentBlockParam[] | string {
  if (attachments.length === 0) {
    return message;
  }

  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const attachment of attachments) {
    if (attachment.kind === 'image') {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: attachment.mediaType,
          data: attachment.data
        }
      });
    } else if (attachment.kind === 'document') {
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: attachment.data
        },
        title: attachment.name
      } as Anthropic.ContentBlockParam);
    } else {
      blocks.push({
        type: 'text',
        text: `Attached file "${attachment.name}":\n\n${attachment.text}`
      });
    }
  }

  const caption =
    message.trim() ||
    'Please read the attached file(s) and respond to the visitor.';
  blocks.push({ type: 'text', text: caption });

  return blocks;
}
