import { format } from 'date-fns';

import {
  htmlToPlainText,
  stripLeadingSubjectFromText
} from '@/lib/inbox/mail-body-display';

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
  const raw = (bodyText?.trim() || htmlToPlainText(bodyHtml ?? '')).trim();
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
