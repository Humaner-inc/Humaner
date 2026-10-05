export type MailDocumentIntent = 'invoice' | 'quote';

const RECEIPT_SUBJECT =
  /\b(receipt|payment received|amount paid|invoice attached|tax invoice|paid in full)\b/i;
const RECEIPT_FROM =
  /(receipts?|invoice|billing|noreply|no-reply|payments?)@|stripe\.com|paypal\.|square(up)?\.|xero\.|quickbooks\./i;
const RECEIPT_BODY =
  /\b(amount paid|payment method|receipt #|invoice #|tax invoice|paid with|total paid)\b/i;

const QUOTE_SUBJECT =
  /\b(quote|quotation|proposal|estimate|pricing|rfq|request for quote)\b/i;
const QUOTE_BODY =
  /\b(can you (send|quote|price)|how much|budget|per (person|head|guest)|we'd like to book|please quote|looking for a quote|guests?)\b/i;

function plainFromHtml(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectMailDocumentIntent(input: {
  subject: string;
  fromAddress: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
}): MailDocumentIntent | null {
  const subject = input.subject ?? '';
  const from = input.fromAddress ?? '';
  const body = `${input.bodyText ?? ''} ${plainFromHtml(input.bodyHtml ?? null)}`;

  const receipt =
    RECEIPT_SUBJECT.test(subject) ||
    RECEIPT_FROM.test(from) ||
    RECEIPT_BODY.test(body);
  if (receipt) return 'invoice';

  if (QUOTE_SUBJECT.test(subject) || QUOTE_BODY.test(body)) {
    return 'quote';
  }

  return null;
}
