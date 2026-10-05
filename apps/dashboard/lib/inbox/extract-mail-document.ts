import 'server-only';

import { LLM_MODELS } from '@humaner/shared/plans';

import type { MailDocumentIntent } from '@/lib/inbox/mail-document-intent';
import {
  getAnthropicClient,
  isAnthropicConfigured
} from '@/lib/llm/anthropic-client';

export type ExtractedDocumentLine = {
  description: string;
  quantity: number;
  unitAmountCents: number;
  totalCents: number;
  taxRatePercent: number | null;
};

export type ExtractedMailDocument = {
  counterpartyName: string | null;
  counterpartyEmail: string | null;
  counterpartyAddress: string | null;
  counterpartyPhone: string | null;
  counterpartyTaxId: string | null;
  issuerName: string | null;
  issuerLegalName: string | null;
  issuerAddress: string | null;
  issuerEmail: string | null;
  issuerPhone: string | null;
  issuerWebsite: string | null;
  issuerTaxId: string | null;
  billToName: string | null;
  billToAddress: string | null;
  billToEmail: string | null;
  billToPhone: string | null;
  billToTaxId: string | null;
  originalReference: string | null;
  currency: string;
  amountCents: number;
  subtotalCents: number;
  taxAmountCents: number;
  taxRatePercent: number | null;
  dueAt: string | null;
  issuedAt: string | null;
  supplyAt: string | null;
  paymentTerms: string | null;
  paymentDetails: string | null;
  notes: string | null;
  lineItems: ExtractedDocumentLine[];
};

const EXTRACT_SCHEMA = `{
  "issuerName": string | null (brand on the document, e.g. "Neon"),
  "issuerLegalName": string | null (legal entity, e.g. "Neon, LLC"),
  "issuerAddress": string | null (full postal address, newlines allowed),
  "issuerEmail": string | null,
  "issuerPhone": string | null,
  "issuerWebsite": string | null (https URL or domain),
  "issuerTaxId": string | null,
  "billToName": string | null (customer as printed),
  "billToAddress": string | null,
  "billToEmail": string | null,
  "billToPhone": string | null,
  "billToTaxId": string | null,
  "originalReference": string | null (source invoice/quote number as printed),
  "currency": string (ISO 4217, e.g. "EUR" or "USD"),
  "amountCents": number (integer amount due / gross total, minor units; credits negative),
  "subtotalCents": number (integer net total before tax, minor units),
  "taxAmountCents": number (integer tax/VAT total, minor units),
  "taxRatePercent": number | null,
  "dueAt": string | null (ISO-8601 date),
  "issuedAt": string | null (ISO-8601 date),
  "supplyAt": string | null (ISO-8601 supply/service date),
  "paymentTerms": string | null,
  "paymentDetails": string | null (IBAN, payment method, account),
  "notes": string | null,
  "lineItems": [{ "description": string (real product/service; include period on a second line), "quantity": number, "unitAmountCents": number (credits negative), "totalCents": number, "taxRatePercent": number | null }]
}`;

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asOptionalInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  return null;
}

function asInt(value: unknown): number {
  return asOptionalInt(value) ?? 0;
}

function asDecimal(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asRate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapExtracted(raw: Record<string, unknown>): ExtractedMailDocument {
  const linesUnknown = Array.isArray(raw.lineItems) ? raw.lineItems : [];
  const lineItems: ExtractedDocumentLine[] = [];
  for (const item of linesUnknown) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const description = asString(row.description) ?? 'Services';
    const quantity = asDecimal(row.quantity);
    const unitAmountCents = asOptionalInt(row.unitAmountCents) ?? 0;
    const totalCents =
      asOptionalInt(row.totalCents) ??
      Math.round(unitAmountCents * (quantity || 1));
    if (!description) continue;
    lineItems.push({
      description,
      quantity:
        quantity !== 0
          ? quantity
          : totalCents < 0 || (unitAmountCents !== 0 && totalCents === 0)
            ? 0
            : 1,
      unitAmountCents,
      totalCents,
      taxRatePercent: asRate(row.taxRatePercent)
    });
  }

  const lineTotal = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
  const taxAmountCents = Math.max(asInt(raw.taxAmountCents), 0);
  const subtotalCents =
    Math.max(asInt(raw.subtotalCents), 0) ||
    (taxAmountCents > 0 && lineTotal >= taxAmountCents
      ? lineTotal - taxAmountCents
      : lineTotal);
  const amountCents =
    asInt(raw.amountCents) || subtotalCents + taxAmountCents || lineTotal;

  const issuerName = asString(raw.issuerName) ?? asString(raw.counterpartyName);
  const issuerEmail =
    asString(raw.issuerEmail)?.toLowerCase() ??
    asString(raw.counterpartyEmail)?.toLowerCase() ??
    null;
  const billToName = asString(raw.billToName);
  const billToEmail = asString(raw.billToEmail)?.toLowerCase() ?? null;

  return {
    counterpartyName: issuerName,
    counterpartyEmail: issuerEmail,
    counterpartyAddress:
      asString(raw.issuerAddress) ?? asString(raw.counterpartyAddress),
    counterpartyPhone:
      asString(raw.issuerPhone) ?? asString(raw.counterpartyPhone),
    counterpartyTaxId:
      asString(raw.issuerTaxId) ?? asString(raw.counterpartyTaxId),
    issuerName,
    issuerLegalName: asString(raw.issuerLegalName) ?? issuerName,
    issuerAddress:
      asString(raw.issuerAddress) ?? asString(raw.counterpartyAddress),
    issuerEmail,
    issuerPhone: asString(raw.issuerPhone) ?? asString(raw.counterpartyPhone),
    issuerWebsite: asString(raw.issuerWebsite),
    issuerTaxId: asString(raw.issuerTaxId) ?? asString(raw.counterpartyTaxId),
    billToName,
    billToAddress: asString(raw.billToAddress),
    billToEmail,
    billToPhone: asString(raw.billToPhone),
    billToTaxId: asString(raw.billToTaxId),
    originalReference: asString(raw.originalReference),
    currency: (asString(raw.currency) ?? 'EUR').toUpperCase().slice(0, 8),
    amountCents: Math.max(amountCents, 0),
    subtotalCents: Math.max(subtotalCents, 0),
    taxAmountCents,
    taxRatePercent: asRate(raw.taxRatePercent),
    dueAt: asString(raw.dueAt),
    issuedAt: asString(raw.issuedAt),
    supplyAt: asString(raw.supplyAt),
    paymentTerms: asString(raw.paymentTerms),
    paymentDetails: asString(raw.paymentDetails),
    notes: asString(raw.notes),
    lineItems
  };
}

function fallbackExtract(input: {
  fromAddress: string;
  bodyText: string;
}): ExtractedMailDocument {
  const emailMatch = input.fromAddress.match(/<([^>]+)>/);
  const email = (emailMatch?.[1] ?? input.fromAddress).trim().toLowerCase();
  const name = input.fromAddress
    .replace(/<[^>]+>/, '')
    .replace(/"/g, '')
    .trim();
  const amountMatch = input.bodyText.match(
    /(?:€|EUR|\$|USD|£|GBP)\s*([0-9][0-9.,]*)/i
  );
  let amountCents = 0;
  if (amountMatch?.[1]) {
    const normalized = amountMatch[1].replace(/,/g, '');
    const value = Number(normalized);
    if (Number.isFinite(value)) {
      amountCents = Math.round(value * 100);
    }
  }
  const issuerEmail = email.includes('@') ? email : null;
  return {
    counterpartyName: name || null,
    counterpartyEmail: issuerEmail,
    counterpartyAddress: null,
    counterpartyPhone: null,
    counterpartyTaxId: null,
    issuerName: name || null,
    issuerLegalName: name || null,
    issuerAddress: null,
    issuerEmail,
    issuerPhone: null,
    issuerWebsite: null,
    issuerTaxId: null,
    billToName: null,
    billToAddress: null,
    billToEmail: null,
    billToPhone: null,
    billToTaxId: null,
    originalReference: null,
    currency: /€|EUR/i.test(input.bodyText)
      ? 'EUR'
      : /£|GBP/i.test(input.bodyText)
        ? 'GBP'
        : 'USD',
    amountCents,
    subtotalCents: amountCents,
    taxAmountCents: 0,
    taxRatePercent: null,
    dueAt: null,
    issuedAt: null,
    supplyAt: null,
    paymentTerms: null,
    paymentDetails: null,
    notes: null,
    lineItems: []
  };
}

export async function extractMailDocument(input: {
  kind: MailDocumentIntent;
  subject: string;
  fromAddress: string;
  bodyText: string | null;
  bodyHtml: string | null;
}): Promise<ExtractedMailDocument> {
  const body =
    (input.bodyText ?? '').trim() ||
    (input.bodyHtml ?? '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const fallback = fallbackExtract({
    fromAddress: input.fromAddress,
    bodyText: `${input.subject}\n${body}`
  });

  if (!isAnthropicConfigured() || body.length < 12) {
    return fallback;
  }

  const role =
    input.kind === 'invoice'
      ? 'Reconstruct the source invoice. The ISSUER BRAND (logo company — e.g. Neon, Xolo) MUST be gathered from the email: legal name, postal address, website, VAT, billing email. Do not use the mailbox owner as the issuer. BILL TO is the customer printed on the invoice. Line items must be the real products/services with quantities and rates (decimals allowed; credits negative). Never invent "Payment to …". Copy the printed invoice number into originalReference.'
      : 'Extract a quote the workspace will issue. issuer* is unused. billTo* / counterparty is the customer. Infer line items from quantities, rates, and dates. Capture addresses, tax IDs, and validity terms.';

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: LLM_MODELS.SONNET_45.id,
      max_tokens: 1800,
      system: `${role} Return ONLY JSON matching ${EXTRACT_SCHEMA}. Amounts in minor units (cents).`,
      messages: [
        {
          role: 'user',
          content: `Subject: ${input.subject}\nFrom: ${input.fromAddress}\n\n${body.slice(0, 12_000)}`
        }
      ]
    });
    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');
    const parsed = parseJsonObject(text);
    if (!parsed) return fallback;
    const mapped = mapExtracted(parsed);
    const issuerName = mapped.issuerName ?? fallback.issuerName;
    const billToName = mapped.billToName;
    const isInvoice = input.kind === 'invoice';
    return {
      counterpartyName: isInvoice
        ? issuerName
        : (billToName ?? mapped.counterpartyName ?? fallback.counterpartyName),
      counterpartyEmail: isInvoice
        ? (mapped.issuerEmail ?? fallback.issuerEmail)
        : (mapped.billToEmail ?? fallback.counterpartyEmail),
      counterpartyAddress: isInvoice
        ? mapped.issuerAddress
        : mapped.billToAddress,
      counterpartyPhone: isInvoice ? mapped.issuerPhone : mapped.billToPhone,
      counterpartyTaxId: isInvoice ? mapped.issuerTaxId : mapped.billToTaxId,
      issuerName,
      issuerLegalName: mapped.issuerLegalName ?? issuerName,
      issuerAddress: mapped.issuerAddress,
      issuerEmail: mapped.issuerEmail ?? fallback.issuerEmail,
      issuerPhone: mapped.issuerPhone,
      issuerWebsite: mapped.issuerWebsite,
      issuerTaxId: mapped.issuerTaxId,
      billToName,
      billToAddress: mapped.billToAddress,
      billToEmail: mapped.billToEmail,
      billToPhone: mapped.billToPhone,
      billToTaxId: mapped.billToTaxId,
      originalReference: mapped.originalReference,
      currency: mapped.currency || fallback.currency,
      amountCents: mapped.amountCents || fallback.amountCents,
      subtotalCents:
        mapped.subtotalCents || mapped.amountCents || fallback.amountCents,
      taxAmountCents: mapped.taxAmountCents,
      taxRatePercent: mapped.taxRatePercent,
      dueAt: mapped.dueAt,
      issuedAt: mapped.issuedAt,
      supplyAt: mapped.supplyAt,
      paymentTerms: mapped.paymentTerms,
      paymentDetails: mapped.paymentDetails,
      notes: mapped.notes,
      lineItems: mapped.lineItems
    };
  } catch (error) {
    console.error('[inbox] Document extract failed', error);
    return fallback;
  }
}
