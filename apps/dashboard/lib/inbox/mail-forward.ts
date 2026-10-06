import { format } from 'date-fns';

import {
  htmlToPlainText,
  looksLikeMailSource,
  stripLeadingSubjectFromText
} from '@/lib/inbox/mail-body-display';

/** Plain-text separators (`***`, `---`) that marketing text/plain parts use as rules. */
const SEPARATOR_LINE = /^\s*([*_=\-])\1{2,}\s*$/;

function cleanForwardQuote(text: string): string {
  return text
    .split('\n')
    .filter((line) => !SEPARATOR_LINE.test(line))
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Quote the message the reading pane shows. Rich HTML's text/plain twin is
 * often a different document (`***` rules, duplicated blocks), so prefer a
 * plain rendering of the HTML when that rendering is real copy.
 */
function forwardQuoteText(
  bodyHtml: string | null,
  bodyText: string | null
): string {
  const fromHtml = bodyHtml ? htmlToPlainText(bodyHtml).trim() : '';
  const fromText = bodyText?.trim() ?? '';
  const htmlUsable = fromHtml.length >= 8 && !looksLikeMailSource(fromHtml);
  const raw = htmlUsable ? fromHtml : fromText || fromHtml;
  return cleanForwardQuote(raw);
}

export function buildForwardSubject(
  subject: string | null | undefined
): string {
  const clean = (subject ?? '')
    .replace(/^\s*(?:fwd?|fw|re)\s*:\s*/gi, '')
    .trim();
  return clean ? `Fwd: ${clean}` : 'Fwd:';
}

export function buildForwardBody({
  fromAddress,
  sentAt,
  subject,
  bodyHtml,
  bodyText
}: {
  fromAddress: string;
  sentAt: string;
  subject: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
}): string {
  const raw = forwardQuoteText(bodyHtml, bodyText);
  const quoted =
    stripLeadingSubjectFromText(raw, subject)?.trim() || raw || '(no content)';
  const when = Number.isNaN(Date.parse(sentAt))
    ? sentAt
    : format(new Date(sentAt), 'PPP p');

  return [
    '',
    '---------- Forwarded message ----------',
    `From: ${fromAddress}`,
    `Date: ${when}`,
    `Subject: ${subject?.trim() || '(no subject)'}`,
    '',
    quoted
  ].join('\n');
}
