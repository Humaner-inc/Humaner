import 'server-only';

import sanitizeHtml from 'sanitize-html';

import {
  htmlToPlainText,
  rewriteMailAssetUrls,
  stripMailPreviewBlocks
} from '@/lib/inbox/mail-body-display';

export const MAX_MAIL_BODY_CHARS = 500_000;

const MAIL_HTML_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  'img',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'col',
  'colgroup',
  'center',
  'font',
  'picture',
  'source',
  'figure',
  'figcaption',
  'button',
  'u',
  's',
  'strike',
  'small',
  'big',
  // Keep author <style> blocks — many templates (incl. react-email) rely on them
  // for borders/margins that are not fully inlined.
  'style'
]);

const MAIL_HTML_ATTRS: sanitizeHtml.IOptions['allowedAttributes'] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  '*': [
    'style',
    'class',
    'align',
    'valign',
    'bgcolor',
    'width',
    'height',
    'border',
    'role',
    'dir',
    'lang'
  ],
  a: ['href', 'name', 'target', 'rel', 'style', 'class'],
  img: [
    'src',
    'srcset',
    'alt',
    'title',
    'width',
    'height',
    'style',
    'class',
    'align',
    'border',
    'loading',
    'decoding',
    'referrerpolicy'
  ],
  table: [
    'width',
    'height',
    'cellpadding',
    'cellspacing',
    'border',
    'align',
    'bgcolor',
    'role',
    'style',
    'class'
  ],
  td: [
    'colspan',
    'rowspan',
    'width',
    'height',
    'align',
    'valign',
    'bgcolor',
    'style',
    'class'
  ],
  th: [
    'colspan',
    'rowspan',
    'width',
    'height',
    'align',
    'valign',
    'bgcolor',
    'style',
    'class'
  ],
  tr: ['align', 'valign', 'bgcolor', 'style', 'class'],
  col: ['span', 'width', 'style', 'class', 'align'],
  colgroup: ['span', 'width', 'style', 'class', 'align'],
  font: ['color', 'face', 'size', 'style'],
  source: ['srcset', 'media', 'type', 'sizes']
};

function normalizeMailImageSrc(src: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
}

/** Strip scripts/handlers and rewrite local asset URLs before HTML is stored. */
export function sanitizeMailHtml(
  value: string | false | null | undefined
): string | null {
  if (!value) return null;

  const sanitized = sanitizeHtml(value, {
    allowedTags: MAIL_HTML_TAGS,
    allowedAttributes: MAIL_HTML_ATTRS,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    },
    allowVulnerableTags: true,
    parseStyleAttributes: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank'
      }),
      img: (tagName, attribs) => {
        const src = attribs.src
          ? normalizeMailImageSrc(attribs.src)
          : undefined;
        return {
          tagName,
          attribs: src ? { ...attribs, src } : attribs
        };
      }
    }
  });

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://app.humaner.io';

  return rewriteMailAssetUrls(stripMailPreviewBlocks(sanitized), origin).slice(
    0,
    MAX_MAIL_BODY_CHARS
  );
}

/**
 * Normalize MIME parts for storage. Prefer authored HTML; when the sender
 * omitted a text/plain part, derive plain text from the HTML so suggestions
 * and plain fallbacks still work.
 */
export function resolveStoredMailBodies(input: {
  html?: string | false | null;
  text?: string | null;
}): { bodyHtml: string | null; bodyText: string | null } {
  const bodyHtml = sanitizeMailHtml(
    typeof input.html === 'string' ? input.html : null
  );
  const rawText = input.text?.trim()
    ? input.text.slice(0, MAX_MAIL_BODY_CHARS)
    : null;
  const bodyText =
    rawText ||
    (bodyHtml
      ? htmlToPlainText(bodyHtml).slice(0, MAX_MAIL_BODY_CHARS) || null
      : null);
  return { bodyHtml, bodyText };
}
