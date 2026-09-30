import 'server-only';

import sharp from 'sharp';

import {
  SIGNATURE_ICON_HEIGHT_DEFAULT,
  SIGNATURE_ICON_HEIGHT_MAX,
  SIGNATURE_ICON_HEIGHT_MIN
} from '@/schemas/inbox/update-mailbox-signature-schema';

export const MAILBOX_SIGNATURE_ICON_CID = 'signature-icon@humaner';

export type MailboxSignatureIcon = {
  data: Buffer;
  contentType: string;
};

export type MailboxSignature = {
  text: string | null;
  icon: MailboxSignatureIcon | null;
  /** Display height in px for HTML mail (default 48). */
  iconHeight?: number | null;
};

export type AppliedMailboxSignature = {
  text: string;
  html?: string;
  inlineIcon?: {
    name: string;
    mediaType: string;
    data: string;
    cid: string;
  };
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toHtmlParagraphs(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>\n');
}

export function clampSignatureIconHeight(
  value: number | null | undefined
): number {
  if (value == null || !Number.isFinite(value)) {
    return SIGNATURE_ICON_HEIGHT_DEFAULT;
  }
  return Math.min(
    SIGNATURE_ICON_HEIGHT_MAX,
    Math.max(SIGNATURE_ICON_HEIGHT_MIN, Math.round(value))
  );
}

/** Decode a data-URL image, including `image/svg+xml`. */
export function decodeSignatureIconDataUrl(dataUrl: string): {
  buffer: Buffer;
  mimeType: string;
} {
  if (!dataUrl.startsWith('data:')) {
    throw new Error("Couldn't decode signature icon");
  }

  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    throw new Error('Could not distinguish signature icon type');
  }

  const meta = dataUrl.slice(5, comma);
  const payload = dataUrl.slice(comma + 1);
  const mimeType = (meta.split(';')[0] ?? '').trim().toLowerCase();
  if (!mimeType) {
    throw new Error('Could not distinguish signature icon type');
  }

  const buffer = /;base64/i.test(meta)
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8');

  return { buffer, mimeType };
}

/**
 * Normalize uploads for storage: SVG kept as-is (size-capped), raster
 * images resized and stored as PNG (supports transparency).
 */
export async function prepareSignatureIconForStorage(
  buffer: Buffer,
  mimeType: string
): Promise<MailboxSignatureIcon> {
  const normalized = mimeType.toLowerCase().split(';')[0]?.trim() ?? mimeType;

  if (normalized === 'image/svg+xml') {
    if (buffer.byteLength > 200_000) {
      throw new Error('SVG signature icons must be under 200KB.');
    }
    const head = buffer.toString('utf8', 0, Math.min(buffer.byteLength, 256));
    if (!/<svg[\s>]/i.test(head) && !/<\?xml/i.test(head)) {
      throw new Error('Invalid SVG file.');
    }
    return { data: buffer, contentType: 'image/svg+xml' };
  }

  if (
    normalized !== 'image/png' &&
    normalized !== 'image/jpeg' &&
    normalized !== 'image/jpg' &&
    normalized !== 'image/webp' &&
    normalized !== 'image/gif'
  ) {
    throw new Error('Signature icon must be PNG, SVG, JPEG, WebP, or GIF.');
  }

  const data = await sharp(buffer)
    .resize({
      width: 320,
      height: 128,
      fit: 'inside',
      withoutEnlargement: true
    })
    .png()
    .toBuffer();

  return { data, contentType: 'image/png' };
}

/** Rasterize SVG so outbound MIME clients can render the logo. */
export async function prepareSignatureIconForEmail(
  icon: MailboxSignatureIcon
): Promise<MailboxSignatureIcon & { name: string }> {
  if (icon.contentType.includes('svg')) {
    const data = await sharp(icon.data)
      .resize({
        width: 320,
        height: 128,
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();
    return { data, contentType: 'image/png', name: 'signature.png' };
  }

  const extension = icon.contentType.includes('jpeg')
    ? 'jpg'
    : icon.contentType.includes('webp')
      ? 'webp'
      : icon.contentType.includes('gif')
        ? 'gif'
        : 'png';

  return {
    data: icon.data,
    contentType: icon.contentType,
    name: `signature.${extension}`
  };
}

export async function applyMailboxSignature(
  body: string,
  signature: MailboxSignature,
  options?: { bodyHtml?: string }
): Promise<AppliedMailboxSignature> {
  const trimmedText = signature.text?.trim() ?? '';
  const hasText = trimmedText.length > 0;
  const hasIcon = Boolean(signature.icon);
  const existingHtml = options?.bodyHtml?.trim() || null;

  if (!hasText && !hasIcon) {
    return {
      text: body,
      html: existingHtml ?? undefined
    };
  }

  const textParts = [body.replace(/\s+$/u, '')];
  textParts.push('', '--');
  if (hasIcon) {
    textParts.push('[signature image]');
  }
  if (hasText) {
    textParts.push(trimmedText);
  }

  const text = textParts.join('\n');

  if (!hasIcon || !signature.icon) {
    if (!existingHtml && !hasText) {
      return { text };
    }

    const baseHtml =
      existingHtml ??
      `<div>${toHtmlParagraphs(body.replace(/\s+$/u, ''))}</div>`;
    const html = hasText
      ? `${baseHtml}<br><div>--<br>${toHtmlParagraphs(trimmedText)}</div>`
      : baseHtml;

    return { text, html };
  }

  const emailIcon = await prepareSignatureIconForEmail(signature.icon);
  const iconHeight = clampSignatureIconHeight(signature.iconHeight);
  const baseHtml =
    existingHtml ?? `<div>${toHtmlParagraphs(body.replace(/\s+$/u, ''))}</div>`;
  const html = [
    baseHtml,
    '<br>',
    '<div>',
    '--<br>',
    `<img src="cid:${MAILBOX_SIGNATURE_ICON_CID}" alt="" height="${iconHeight}" style="height:${iconHeight}px;width:auto;max-width:240px;" />`,
    hasText ? `<br>${toHtmlParagraphs(trimmedText)}` : '',
    '</div>'
  ].join('');

  return {
    text,
    html,
    inlineIcon: {
      name: emailIcon.name,
      mediaType: emailIcon.contentType,
      data: emailIcon.data.toString('base64'),
      cid: MAILBOX_SIGNATURE_ICON_CID
    }
  };
}
