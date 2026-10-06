import { randomBytes } from 'node:crypto';

import { IMAP_SYNC_TEXT_BYTES } from '@/lib/inbox/imap-sync-plan';

export const IMAP_BODY_TOO_LARGE_TEXT =
  'This message is too large to preview. Open it to load the text.';

// one open thread, still bounded
export const IMAP_ON_DEMAND_TEXT_BYTES = 15 * 1024 * 1024;

const IMAP_PART_ID = /^\d+(\.\d+)*$/;
const MIME_TOKEN = /^[\w.+-]+$/;
const MEDIA_TYPE = /^[a-z0-9][\w.+-]*\/[a-z0-9][\w.+-]*$/;

export function isImapPartId(value: string): boolean {
  return value.length <= 64 && IMAP_PART_ID.test(value);
}

export function isImapMailboxPath(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 512 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export function safeMailMediaType(value: string | undefined): string {
  const type = (value ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  return MEDIA_TYPE.test(type) ? type : 'application/octet-stream';
}

export type ImapBodyNode = {
  part?: string;
  type?: string;
  size?: number;
  encoding?: string;
  disposition?: string;
  parameters?: Record<string, string>;
  dispositionParameters?: Record<string, string>;
  childNodes?: ImapBodyNode[];
};

export type SelectedTextPart = {
  part: string;
  type: 'text/plain' | 'text/html';
  size: number;
  encoding?: string;
  charset?: string;
};

export type ImapAttachmentMeta = {
  part: string;
  filename: string;
  mediaType: string;
  sizeBytes: number;
};

export type ImapEnvelopeLike = {
  date?: Date | string;
  subject?: string;
  messageId?: string;
  inReplyTo?: string;
  from?: Array<{ name?: string; address?: string }>;
  to?: Array<{ name?: string; address?: string }>;
  cc?: Array<{ name?: string; address?: string }>;
};

function mediaType(type: string | undefined): string {
  return (type ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
}

function walk(
  node: ImapBodyNode | undefined,
  inheritedAttachment: boolean,
  text: SelectedTextPart[],
  attachments: ImapAttachmentMeta[]
): void {
  if (!node) return;

  const disposition = (node.disposition ?? '').toLowerCase();
  const isAttachment = inheritedAttachment || disposition === 'attachment';
  const type = mediaType(node.type);
  const rawPart =
    node.part ||
    (!node.childNodes?.length &&
    (type === 'text/plain' || type === 'text/html' || isAttachment)
      ? '1'
      : '');
  const part = isImapPartId(rawPart) ? rawPart : '';

  if (
    !isAttachment &&
    (type === 'text/plain' || type === 'text/html') &&
    part
  ) {
    text.push({
      part,
      type,
      size: node.size ?? 0,
      encoding: node.encoding,
      charset: node.parameters?.charset
    });
  } else if (
    isAttachment &&
    part &&
    !type.startsWith('multipart/') &&
    disposition !== 'inline'
  ) {
    attachments.push({
      part,
      filename: safeFilename(
        node.dispositionParameters?.filename ||
          node.parameters?.name ||
          'attachment'
      ),
      mediaType: safeMailMediaType(type),
      sizeBytes: node.size ?? 0
    });
  } else if (
    !isAttachment &&
    part &&
    type &&
    !type.startsWith('multipart/') &&
    !type.startsWith('text/') &&
    disposition !== 'inline'
  ) {
    attachments.push({
      part,
      filename: safeFilename(
        node.dispositionParameters?.filename ||
          node.parameters?.name ||
          'attachment'
      ),
      mediaType: safeMailMediaType(type),
      sizeBytes: node.size ?? 0
    });
  }

  for (const child of node.childNodes ?? []) {
    walk(child, isAttachment, text, attachments);
  }
}

// first text/plain and text/html that are not attachments
export function selectTextParts(
  root: ImapBodyNode | undefined
): SelectedTextPart[] {
  const text: SelectedTextPart[] = [];
  walk(root, false, text, []);
  const plain = text.find((part) => part.type === 'text/plain');
  const html = text.find((part) => part.type === 'text/html');
  return [plain, html].filter((part): part is SelectedTextPart => part != null);
}

export function selectAttachmentParts(
  root: ImapBodyNode | undefined
): ImapAttachmentMeta[] {
  const attachments: ImapAttachmentMeta[] = [];
  walk(root, false, [], attachments);
  return attachments;
}

export function textPartsExceedCap(
  parts: readonly SelectedTextPart[],
  cap = IMAP_SYNC_TEXT_BYTES
): boolean {
  let total = 0;
  for (const part of parts) total += part.size;
  return total > cap;
}

export function headerField(
  raw: Buffer | undefined,
  name: string
): string | undefined {
  if (!raw?.length) return undefined;
  const unfolded = raw.toString('utf8').replace(/\r?\n[ \t]+/g, ' ');
  const match = new RegExp(`^${name}:\\s*(.*)$`, 'im').exec(unfolded);
  const value = match?.[1]?.trim();
  return value || undefined;
}

function formatAddress(entry: { name?: string; address?: string }): string {
  const address = entry.address?.trim();
  if (!address) return '';
  const name = entry.name?.replace(/[\r\n"]/g, '').trim();
  return name ? `"${name}" <${address}>` : address;
}

function formatAddressList(
  entries: Array<{ name?: string; address?: string }> | undefined
): string {
  return (entries ?? []).map(formatAddress).filter(Boolean).join(', ');
}

function headerLine(name: string, value: string | undefined): string {
  const clean = value?.replace(/[\r\n]/g, ' ').trim();
  if (!clean) return '';
  return `${name}: ${clean}\r\n`;
}

function mimeToken(value: string | undefined, fallback: string): string {
  const token = value?.trim() ?? '';
  return MIME_TOKEN.test(token) ? token : fallback;
}

function safeFilename(value: string): string {
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (cleaned || 'attachment').slice(0, 512);
}

function partSection(
  part: { raw: Buffer; charset?: string; encoding?: string },
  type: string
): string {
  const charset = mimeToken(part.charset, 'utf-8');
  const encoding = mimeToken(part.encoding, '8bit');
  return (
    `Content-Type: ${type}; charset="${charset}"\r\n` +
    `Content-Transfer-Encoding: ${encoding}\r\n` +
    `\r\n` +
    part.raw.toString('binary')
  );
}

// headers plus text and html, with a random boundary
export function buildTextOnlySource(input: {
  envelope: ImapEnvelopeLike;
  references?: string;
  text?: { raw: Buffer; charset?: string; encoding?: string };
  html?: { raw: Buffer; charset?: string; encoding?: string };
}): Buffer {
  const date =
    input.envelope.date instanceof Date
      ? input.envelope.date.toUTCString()
      : input.envelope.date;
  let headers =
    headerLine('Date', date) +
    headerLine('From', formatAddressList(input.envelope.from)) +
    headerLine('To', formatAddressList(input.envelope.to)) +
    headerLine('Cc', formatAddressList(input.envelope.cc)) +
    headerLine('Subject', input.envelope.subject) +
    headerLine('Message-ID', input.envelope.messageId) +
    headerLine('In-Reply-To', input.envelope.inReplyTo) +
    headerLine('References', input.references);

  const text = input.text;
  const html = input.html;
  if (text && html) {
    const boundary = `b${randomBytes(12).toString('hex')}`;
    headers +=
      `MIME-Version: 1.0\r\n` +
      `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n` +
      `--${boundary}\r\n${partSection(text, 'text/plain')}\r\n` +
      `--${boundary}\r\n${partSection(html, 'text/html')}\r\n` +
      `--${boundary}--\r\n`;
  } else if (html) {
    headers += `MIME-Version: 1.0\r\n${partSection(html, 'text/html')}`;
  } else if (text) {
    headers += `MIME-Version: 1.0\r\n${partSection(text, 'text/plain')}`;
  } else {
    headers += `\r\n`;
  }

  return Buffer.from(headers, 'binary');
}
