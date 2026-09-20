/**
 * Display helpers for collaborative inbox message bodies.
 */

/** Tags that indicate a designed / marketing HTML email (keep white iframe). */
const RICH_MAIL_TAG_RE =
  /<\s*(table|thead|tbody|tfoot|tr|td|th|img|picture|svg|video|source|style|font|center)\b/i;

/** Background styling — only these force the white HTML shell. */
const RICH_MAIL_BG_ATTR_RE = /\s(?:bgcolor|background)\s*=/i;
const RICH_MAIL_BG_STYLE_RE =
  /style\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:/i;

const PREVIEW_OPEN_RE = /<(div|span|p)\b([^>]*?)>/gi;
const PREVIEW_ATTR_RE =
  /id\s*=\s*["']__react-email-preview["']|class\s*=\s*["'][^"']*(?:preheader|preview-text|previewtext|mcnPreviewText)[^"']*["']|display\s*:\s*none|max-height\s*:\s*0|opacity\s*:\s*0|overflow\s*:\s*hidden|visibility\s*:\s*hidden|mso-hide/i;

/** Localhost / relative app asset URLs that break when the mail is viewed later. */
const BROKEN_APP_ASSET_SRC_RE =
  /(?:https?:)?\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/(?:brandmark-dark|brandmark_blue)\.(?:png|svg))/gi;

const RELATIVE_APP_ASSET_SRC_RE =
  /(?:src|href)=(["'])(\/(?:brandmark-dark|brandmark_blue)\.(?:png|svg))\1/gi;

function normalizeComparable(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * True when HTML should render in the isolated white iframe.
 * Plain-text messages (and simple Gmail `text/html` wrappers) return false
 * so they inherit the app theme instead of a white card.
 */
export function isRichMailHtml(bodyHtml: string | null | undefined): boolean {
  if (!bodyHtml?.trim()) return false;
  if (RICH_MAIL_TAG_RE.test(bodyHtml)) return true;
  if (RICH_MAIL_BG_ATTR_RE.test(bodyHtml)) return true;
  if (RICH_MAIL_BG_STYLE_RE.test(bodyHtml)) return true;
  return false;
}

/** Block / inline tags that should keep authored spacing in the reading pane. */
const STRUCTURED_MAIL_TAG_RE =
  /<\s*(p|br|ul|ol|li|h[1-6]|blockquote|pre|hr|strong|em|b|i|a|div)\b/i;

/**
 * True when HTML has real structure (paragraphs, lists, breaks) even if it
 * is not a designed marketing table. Those should not flatten to one line.
 */
export function isStructuredMailHtml(
  bodyHtml: string | null | undefined
): boolean {
  if (!bodyHtml?.trim()) return false;
  if (isRichMailHtml(bodyHtml)) return false;
  return STRUCTURED_MAIL_TAG_RE.test(bodyHtml);
}

const SOURCE_BLOCK_RE = /<(style|script|head|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi;
const UNCLOSED_SOURCE_RE = /<(style|script|head|noscript)\b[^>]*>[\s\S]*$/gi;
const CSS_SOURCE_RE =
  /\{[^}]{0,240}\b(?:font|color|margin|padding|display|background)\s*:/i;

/** Drop `<style>` / `<script>` so CSS source never becomes visible text. */
export function stripMailSourceBlocks(html: string): string {
  return html.replace(SOURCE_BLOCK_RE, '').replace(UNCLOSED_SOURCE_RE, '');
}

export function looksLikeMailSource(text: string): boolean {
  const sample = text.replace(/\s+/g, ' ').trim();
  if (sample.length < 8) return false;
  if (CSS_SOURCE_RE.test(sample)) return true;
  return /^(?:body|html|@media|@font-face)\b/i.test(sample);
}

/** Best-effort plain text from simple HTML when `bodyText` is missing. */
export function htmlToPlainText(bodyHtml: string): string {
  return stripMailSourceBlocks(bodyHtml)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<\/(?:p|div|tr|h[1-6]|blockquote)>/gi, '\n\n')
    .replace(/<\/(?:ul|ol)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Drop a leading subject line that duplicates the thread header. */
export function stripLeadingSubjectFromText(
  bodyText: string | null | undefined,
  subject: string | null | undefined
): string | null {
  if (!bodyText?.trim()) return bodyText ?? null;
  if (!subject?.trim()) return bodyText;

  const needle = normalizeComparable(subject);
  const lines = bodyText.replace(/^\uFEFF/, '').split(/\r?\n/);
  let index = 0;
  while (index < lines.length && !lines[index].trim()) index += 1;
  if (index >= lines.length) return bodyText;

  if (normalizeComparable(lines[index]) === needle) {
    lines.splice(index, 1);
    while (index < lines.length && !lines[index].trim()) lines.splice(index, 1);
    return lines.join('\n');
  }

  return bodyText;
}

/**
 * Remove a leading heading/paragraph that only repeats the thread subject
 * (common in marketing templates that restate the object in the body).
 */
export function stripLeadingSubjectFromHtml(
  bodyHtml: string | null | undefined,
  subject: string | null | undefined
): string | null {
  if (!bodyHtml?.trim()) return bodyHtml ?? null;
  if (!subject?.trim()) return bodyHtml;

  const needle = normalizeComparable(subject);
  const pattern = new RegExp(
    `^\\s*(?:<!--[\\s\\S]*?-->\\s*)*(?:<(?:div|p|h1|h2|h3|span|center|td|th)(?:\\s[^>]*)?>\\s*)*(?:<strong(?:\\s[^>]*)?>\\s*)?(?:${escapeRegExp(
      subject.trim()
    )})(?:\\s*</strong>)?(?:\\s*</(?:div|p|h1|h2|h3|span|center|td|th)>)?`,
    'i'
  );

  const stripped = bodyHtml.replace(pattern, (match) => {
    const text = match
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return normalizeComparable(text) === needle ? '' : match;
  });

  return stripped;
}

/**
 * Rewrite broken localhost / relative app asset URLs to the current origin
 * so transactional logos and social icons still load in the reading pane.
 */
export function rewriteMailAssetUrls(html: string, origin: string): string {
  const base = origin.replace(/\/$/, '');
  return html
    .replace(BROKEN_APP_ASSET_SRC_RE, `${base}$1`)
    .replace(
      RELATIVE_APP_ASSET_SRC_RE,
      (_match, quote: string, path: string) => {
        return `src=${quote}${base}${path}${quote}`;
      }
    );
}

function matchingCloseIndex(html: string, tag: string, from: number): number {
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  const closeRe = new RegExp(`</${tag}\\s*>`, 'gi');
  let depth = 1;
  let cursor = from;
  while (cursor < html.length && depth > 0) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;
    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);
    if (!nextClose) return -1;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      cursor = nextClose.index + nextClose[0].length;
    }
  }
  return depth === 0 ? cursor : -1;
}

/**
 * Strip ESP / react-email preview dumps that often become visible after
 * sanitize or client transforms remove their hiding styles.
 */
export function stripMailPreviewBlocks(html: string): string {
  let out = html;
  const ranges: Array<{ start: number; end: number }> = [];
  PREVIEW_OPEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PREVIEW_OPEN_RE.exec(out))) {
    if (!PREVIEW_ATTR_RE.test(match[2] ?? '')) continue;
    const tag = match[1] ?? 'div';
    const end = matchingCloseIndex(out, tag, match.index + match[0].length);
    if (end < 0) continue;
    ranges.push({ start: match.index, end });
    PREVIEW_OPEN_RE.lastIndex = end;
  }
  for (let i = ranges.length - 1; i >= 0; i -= 1) {
    const range = ranges[i];
    if (!range) continue;
    out = `${out.slice(0, range.start)}${out.slice(range.end)}`;
  }

  return out.replace(/^\s*[^<\n\r]{1,80}\s*(?=<)/, '');
}

/**
 * Prepare stored HTML for iframe display — strip previews, fix asset URLs,
 * drop duplicated subject lines.
 */
export function prepareMailHtmlForDisplay(
  bodyHtml: string,
  subject: string | null | undefined,
  origin?: string
): string {
  let html = stripMailSourceBlocks(stripMailPreviewBlocks(bodyHtml));
  if (origin) {
    html = rewriteMailAssetUrls(html, origin);
  }
  return stripLeadingSubjectFromHtml(html, subject) ?? html;
}
