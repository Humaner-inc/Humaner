import {
  htmlToPlainText,
  isRichMailHtml,
  looksLikeMailSource,
  stripMailUnsafeBlocks
} from '@/lib/inbox/mail-body-display';

export type MailExchange = {
  html: string | null;
  text: string | null;
  attribution: string | null;
};

export type MailBodyTriage = {
  latest: MailExchange;
  previous: MailExchange[];
};

const THREAD_QUOTE_START_RES = [
  /<div[^>]*class=["'][^"']*\b(?:gmail_quote|gmail_extra|protonmail_quote|proton-quote|yahoo_quoted|moz-cite-prefix)\b/i,
  /<blockquote\b/i,
  /<div[^>]*id=["']divRplyFwdMsg["']/i,
  /-----Original Message-----/i,
  /Replying to\s+[\w.+@-]+/i,
  /(?:^|[>\n])\s*On\s[\s\S]{8,180}?wrote:/i
];

const HEADER_QUOTE_START_RE =
  /(?:From|De):\s*[^<\n]{2,160}\s*(?:<br\s*\/?>|\n)\s*(?:To|Sent|Date|Subject)\s*:/i;

const QUOTE_START_RES = [...THREAD_QUOTE_START_RES, HEADER_QUOTE_START_RE];

const OPENING_MARKER_RES = [
  /^\s*<div[^>]*class=["'][^"']*\b(?:gmail_quote|gmail_extra|protonmail_quote|proton-quote|yahoo_quoted)\b[^"']*["'][^>]*>\s*(?:<div[^>]*class=["'][^"']*gmail_attr[^"']*["'][^>]*>[\s\S]*?<\/div>\s*)?(?:<blockquote\b[^>]*>)?/i,
  /^\s*<blockquote\b[^>]*>/i,
  /^\s*<div[^>]*class=["'][^"']*moz-cite-prefix[^"']*["'][^>]*>[\s\S]*?<\/div>/i,
  /^\s*<div[^>]*id=["']divRplyFwdMsg["'][^>]*>/i,
  /^\s*-----Original Message-----[\s\S]*?(?:\n|<br\s*\/?>|$)/i,
  /^\s*Replying to[^\n<]*/i,
  /^\s*On\s[\s\S]{8,180}?wrote:\s*/i,
  /^\s*<(?:div|p|span|hr)[^>]*>\s*Sent insecurely from Private Email(?:\s*<\/(?:div|p|span)>)?/i,
  /^\s*Sent insecurely from Private Email(?:\s|<br\s*\/?>)*/i,
  /^\s*(?:<(?:div|p|span|br|hr)[^>]*>|\s)*(?:From|De):\s*[^<\n]+(?:\n|<br\s*\/?>)(?:\s*(?:To|Cc|Bcc|Date|Sent|Subject|Reply-To):\s*[^<\n]+(?:\n|<br\s*\/?>))+/i
];

const BANNER_LINE_RE =
  /^\s*(?:Sent insecurely from Private Email|Sent with Proton Mail.*|Get Outlook for (?:iOS|Android).*|This email was sent securely.*)\s*$/gim;

const LEADING_HEADER_BLOCK_RE =
  /^(?:\s*(?:From|To|Cc|Bcc|Date|Sent|Subject|Reply-To|De|Van):\s+.+\n)+/;

const LEADING_HTML_HEADER_BLOCK_RE =
  /^(?:\s|<(?:div|p|span|br|hr)[^>]*>|<\/(?:div|p|span)>)*(?:From|De):\s*[^<\n]+(?:\s|<(?:br|div|p|span)[^>]*>|<\/(?:div|p|span)>)+(?:(?:To|Cc|Bcc|Date|Sent|Subject|Reply-To):\s*[^<\n]+(?:\s|<(?:br|div|p|span)[^>]*>|<\/(?:div|p|span)>)+){1,6}/i;

const REPLYING_TO_LINE_RE = /^\s*Replying to\s+\S+[^\n]*/i;
const REPLYING_TO_HTML_RE =
  /<(?:div|p|span)[^>]*>\s*Replying to\s+[^<]+<\/(?:div|p|span)>/gi;

function earliestMatchIndex(source: string, patterns: RegExp[]): number {
  let best = -1;
  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (!match) continue;
    if (best < 0 || match.index < best) best = match.index;
  }
  return best;
}

function skipOpeningMarker(source: string): number {
  for (const pattern of OPENING_MARKER_RES) {
    const match = pattern.exec(source);
    if (match) {
      return Math.max(match[0].length, 1);
    }
  }
  return 1;
}

function visibleText(value: string): string {
  return htmlToPlainText(value).replace(/\s+/g, ' ').trim();
}

function hasSubstance(value: string): boolean {
  const text = visibleText(value);
  if (text.length < 8) return false;
  if (looksLikeMailSource(text)) return false;
  if (/^Sent insecurely from Private Email$/i.test(text)) return false;
  const withoutChrome = text
    .replace(/Replying to\s+\S+(?:\s+on\s+[^.]{0,80})?/gi, ' ')
    .replace(/On\s[\s\S]{8,180}?wrote:/gi, ' ')
    .replace(
      /\b(?:From|To|Cc|Bcc|Date|Sent|Subject|Reply-To|De|Van):\s*\S+/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  return withoutChrome.length >= 8;
}

export function stripMailThreadChrome(value: string): string {
  let out = value.replace(BANNER_LINE_RE, '');
  out = out.replace(/^\s*(?:<br\s*\/?>|<hr\s*\/?>|\s)+/i, '');
  out = out.replace(REPLYING_TO_HTML_RE, '');
  out = out.replace(REPLYING_TO_LINE_RE, '');
  out = out.replace(LEADING_HTML_HEADER_BLOCK_RE, '');
  out = out.replace(LEADING_HEADER_BLOCK_RE, '');
  out = out.replace(/^\s*(?:<br\s*\/?>|<hr\s*\/?>|\s)+/i, '');
  return out.trim();
}

function extractAttribution(segment: string): string | null {
  const text = htmlToPlainText(segment);
  const onWrote = text.match(/On\s[\s\S]{8,160}?wrote:/i);
  if (onWrote?.[0]) {
    return onWrote[0].replace(/\s+/g, ' ').trim();
  }
  const replying = text.match(/Replying to\s+\S+[^\n]{0,80}/i);
  if (replying?.[0]) {
    return replying[0].replace(/\s+/g, ' ').trim();
  }
  const from = text.match(/^(?:From|De):\s*(.+)$/m);
  if (from?.[1]?.trim()) {
    return from[1].trim();
  }
  return null;
}

function mergeAttributionParts(parts: string[]): string[] {
  const merged: string[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (last != null && (!hasSubstance(part) || !hasSubstance(last))) {
      merged[merged.length - 1] = `${last}${part}`;
      continue;
    }
    merged.push(part);
  }
  return merged;
}

function splitSource(source: string): string[] {
  const parts: string[] = [];
  let rest = source;
  let guard = 0;

  while (rest.trim() && guard < 24) {
    guard += 1;
    const quoteAt = earliestMatchIndex(rest, QUOTE_START_RES);
    if (quoteAt < 0) {
      parts.push(rest);
      break;
    }
    if (quoteAt > 0) {
      const head = rest.slice(0, quoteAt);
      if (hasSubstance(head) || parts.length === 0) {
        parts.push(head);
      }
      rest = rest.slice(quoteAt);
      continue;
    }

    const skip = skipOpeningMarker(rest);
    const nestedAt = earliestMatchIndex(rest.slice(skip), QUOTE_START_RES);
    if (nestedAt < 0) {
      parts.push(rest);
      break;
    }
    const cut = skip + nestedAt;
    const current = rest.slice(0, cut);
    if (hasSubstance(current) || parts.length === 0) {
      parts.push(current);
    }
    rest = rest.slice(cut);
  }

  return mergeAttributionParts(parts);
}

function toExchange(segment: string, asHtml: boolean): MailExchange {
  const cleaned = stripMailThreadChrome(segment);
  const text = visibleText(cleaned);
  return {
    html: asHtml && cleaned.trim() ? cleaned : null,
    text: text || null,
    attribution: extractAttribution(segment)
  };
}

function shouldSplitHtml(html: string): boolean {
  if (earliestMatchIndex(html, THREAD_QUOTE_START_RES) >= 0) return true;
  // Designed / table mail often restates From/To in the template. That is
  // not a quoted reply — splitting it renders the same card twice.
  if (isRichMailHtml(html)) return false;
  return HEADER_QUOTE_START_RE.test(html);
}

/**
 * Keep the latest answer/response in view and fold quoted history
 * (Gmail / Proton / Outlook / "On … wrote:") into previous exchanges.
 */
export function triageMailBody(
  bodyHtml: string | null | undefined,
  bodyText: string | null | undefined,
  subject?: string | null
): MailBodyTriage {
  const html = stripMailThreadChrome(
    stripMailUnsafeBlocks(bodyHtml?.trim() ?? '')
  );
  const text = stripMailThreadChrome(bodyText?.trim() ?? '');

  let rawParts: string[] = [];
  let treatAsHtml = false;
  if (html && shouldSplitHtml(html)) {
    rawParts = splitSource(html);
    treatAsHtml = true;
  } else if (html) {
    rawParts = [html];
    treatAsHtml = true;
  } else if (text) {
    rawParts = splitSource(text);
  }

  const exchanges = rawParts
    .map((part) => toExchange(part, treatAsHtml))
    .filter((exchange) => {
      if (!exchange.html && !exchange.text) return false;
      return !looksLikeMailSource(exchange.text ?? '');
    });

  if (exchanges.length === 0) {
    return {
      latest: {
        html: html || null,
        text: text || null,
        attribution: null
      },
      previous: []
    };
  }

  let [latest, ...previous] = exchanges;
  if (latest && !latest.html && !latest.text && previous[0]) {
    latest = previous[0];
    previous = previous.slice(1);
  }

  if (latest && subject?.trim() && latest.text) {
    const needle = subject.replace(/\s+/g, ' ').trim().toLowerCase();
    if (latest.text.replace(/\s+/g, ' ').trim().toLowerCase() === needle) {
      if (previous[0]) {
        latest = previous[0];
        previous = previous.slice(1);
      }
    }
  }

  return {
    latest: latest ?? {
      html: html || null,
      text: text || null,
      attribution: null
    },
    previous
  };
}
