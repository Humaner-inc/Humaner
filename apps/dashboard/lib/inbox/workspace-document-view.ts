import type { ExtractedDocumentLine } from '@/lib/inbox/extract-mail-document';
import { resolveMailBrandLogoUrl } from '@/lib/inbox/resolve-mail-brand-logo';

export type WorkspaceDocumentBrand = {
  name: string;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  address: string | null;
  phone: string | null;
  taxId: string | null;
};

export type WorkspaceDocumentParty = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  website: string | null;
};

export type WorkspaceDocumentPayload = {
  notes?: string | null;
  lineItems?: ExtractedDocumentLine[];
  subject?: string | null;
  originalReference?: string | null;
  counterpartyAddress?: string | null;
  counterpartyPhone?: string | null;
  counterpartyTaxId?: string | null;
  issuerName?: string | null;
  issuerLegalName?: string | null;
  issuerAddress?: string | null;
  issuerEmail?: string | null;
  issuerPhone?: string | null;
  issuerWebsite?: string | null;
  issuerTaxId?: string | null;
  issuerLogoUrl?: string | null;
  billToName?: string | null;
  billToAddress?: string | null;
  billToEmail?: string | null;
  billToPhone?: string | null;
  billToTaxId?: string | null;
  subtotalCents?: number;
  taxAmountCents?: number;
  taxRatePercent?: number | null;
  supplyAt?: string | null;
  paymentTerms?: string | null;
  paymentDetails?: string | null;
};

export type WorkspaceDocumentView = {
  kind: 'INVOICE' | 'QUOTE';
  title: string;
  reference: string;
  originalReference: string | null;
  status: string;
  currency: string;
  issuedAt: Date;
  supplyAt: Date | null;
  dueAt: Date | null;
  paymentTerms: string | null;
  paymentDetails: string | null;
  notes: string | null;
  seller: WorkspaceDocumentParty;
  buyer: WorkspaceDocumentParty;
  issuerLogoUrl: string | null;
  displayReference: string;
  lines: ExtractedDocumentLine[];
  subtotalCents: number;
  taxAmountCents: number;
  taxRatePercent: number | null;
  totalCents: number;
  taxNote: string | null;
  quoteNotice: string | null;
};

export function formatDocumentMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const code = currency.toUpperCase();
  if (code === 'EUR') return `€${amount}`;
  if (code === 'USD') return `$${amount}`;
  if (code === 'GBP') return `£${amount}`;
  return `${code} ${amount}`;
}

export function formatDocumentQuantity(quantity: number): string {
  if (Number.isInteger(quantity)) return String(quantity);
  return String(Number(quantity.toFixed(6)));
}

export function formatDocumentDate(value: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

const GENERIC_LINE = /^(payment to|paid to)\b/i;
const GENERIC_LINE_EXACT = /^(receipt|invoice|item|services)$/i;

function cleanLineDescription(
  description: string,
  counterpartyName: string | null,
  subject: string | null
): string {
  const trimmed = description.trim();
  const generic =
    GENERIC_LINE.test(trimmed) ||
    GENERIC_LINE_EXACT.test(trimmed) ||
    (counterpartyName &&
      trimmed.toLowerCase() === `payment to ${counterpartyName.toLowerCase()}`);
  if (!trimmed || generic) {
    if (subject?.trim()) return subject.trim();
    return 'Services';
  }
  return trimmed;
}

export function splitDocumentLines(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  const normalized = value.replace(/\r\n/g, '\n').trim();
  const byBreak = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (byBreak.length > 1) return byBreak;
  const parts = normalized
    .split(/,\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return parts.length >= 3 ? parts : [normalized];
}

function coalesceParty(
  primary: Partial<WorkspaceDocumentParty>,
  fallback: WorkspaceDocumentParty
): WorkspaceDocumentParty {
  return {
    name: primary.name?.trim() || fallback.name,
    email: primary.email ?? fallback.email,
    phone: primary.phone ?? fallback.phone,
    address: primary.address ?? fallback.address,
    taxId: primary.taxId ?? fallback.taxId,
    website: primary.website ?? fallback.website
  };
}

export function partyDisplayLines(
  party: WorkspaceDocumentParty,
  options?: { includeTaxId?: boolean; issuer?: boolean }
): string[] {
  const includeTaxId = options?.includeTaxId ?? Boolean(party.taxId);
  const skipContact = Boolean(options?.issuer && party.address);
  const lines = [
    party.name,
    ...splitDocumentLines(party.address),
    skipContact ? null : party.email,
    skipContact ? null : party.phone,
    includeTaxId && party.taxId ? `VAT ${party.taxId}` : null
  ].filter((line): line is string => Boolean(line));
  return lines.filter((line, index) => line !== lines[index - 1]);
}

export function addDays(from: Date, days: number): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function asRate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function asDecimal(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseLines(
  value: unknown,
  fallback: ExtractedDocumentLine[]
): ExtractedDocumentLine[] {
  if (!Array.isArray(value)) return fallback;
  const lines: ExtractedDocumentLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const description = asString(row.description) ?? 'Services';
    const quantity = asDecimal(row.quantity);
    const unitAmountCents = asOptionalInt(row.unitAmountCents) ?? 0;
    const totalCents =
      asOptionalInt(row.totalCents) ??
      Math.round(unitAmountCents * (quantity || 1));
    const resolvedQty =
      quantity !== 0
        ? quantity
        : totalCents < 0 || (unitAmountCents !== 0 && totalCents === 0)
          ? 0
          : 1;
    lines.push({
      description,
      quantity: resolvedQty,
      unitAmountCents,
      totalCents,
      taxRatePercent: asRate(row.taxRatePercent)
    });
  }
  return lines.length > 0 ? lines : fallback;
}

export function parseWorkspaceDocumentPayload(
  payload: unknown
): WorkspaceDocumentPayload {
  const raw = asRecord(payload);
  return {
    notes: asString(raw.notes),
    lineItems: parseLines(raw.lineItems, []),
    subject: asString(raw.subject),
    originalReference: asString(raw.originalReference),
    counterpartyAddress: asString(raw.counterpartyAddress),
    counterpartyPhone: asString(raw.counterpartyPhone),
    counterpartyTaxId: asString(raw.counterpartyTaxId),
    issuerName: asString(raw.issuerName),
    issuerLegalName: asString(raw.issuerLegalName),
    issuerAddress: asString(raw.issuerAddress),
    issuerEmail: asString(raw.issuerEmail),
    issuerPhone: asString(raw.issuerPhone),
    issuerWebsite: asString(raw.issuerWebsite),
    issuerTaxId: asString(raw.issuerTaxId),
    issuerLogoUrl: asString(raw.issuerLogoUrl),
    billToName: asString(raw.billToName),
    billToAddress: asString(raw.billToAddress),
    billToEmail: asString(raw.billToEmail),
    billToPhone: asString(raw.billToPhone),
    billToTaxId: asString(raw.billToTaxId),
    subtotalCents: asInt(raw.subtotalCents),
    taxAmountCents: asInt(raw.taxAmountCents),
    taxRatePercent: asRate(raw.taxRatePercent),
    supplyAt: asString(raw.supplyAt),
    paymentTerms: asString(raw.paymentTerms),
    paymentDetails: asString(raw.paymentDetails)
  };
}

export function buildWorkspaceDocumentView(input: {
  kind: 'INVOICE' | 'QUOTE';
  reference: string;
  status: string;
  brand: WorkspaceDocumentBrand;
  counterpartyName: string | null;
  counterpartyEmail: string | null;
  amountCents: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date | null;
  payload: unknown;
}): WorkspaceDocumentView {
  const payload = parseWorkspaceDocumentPayload(input.payload);
  const isInvoice = input.kind === 'INVOICE';
  const title = isInvoice ? 'Invoice' : 'Quote';
  const lines =
    payload.lineItems && payload.lineItems.length > 0
      ? payload.lineItems
      : [
          {
            description: payload.subject || title,
            quantity: 1,
            unitAmountCents: input.amountCents,
            totalCents: input.amountCents,
            taxRatePercent: payload.taxRatePercent ?? null
          }
        ];

  const taxAmountCents = Math.max(payload.taxAmountCents ?? 0, 0);
  const subtotalCents =
    payload.subtotalCents && payload.subtotalCents > 0
      ? payload.subtotalCents
      : Math.max(input.amountCents - taxAmountCents, 0);
  const totalCents = input.amountCents || subtotalCents + taxAmountCents;
  const taxNote = null;

  const workspace: WorkspaceDocumentParty = {
    name: input.brand.name,
    email: input.brand.email,
    phone: input.brand.phone,
    address: input.brand.address,
    taxId: input.brand.taxId,
    website: input.brand.website
  };
  const counterparty: WorkspaceDocumentParty = {
    name: input.counterpartyName?.trim() || '',
    email: input.counterpartyEmail,
    phone: payload.counterpartyPhone ?? null,
    address: payload.counterpartyAddress ?? null,
    taxId: payload.counterpartyTaxId ?? null,
    website: payload.issuerWebsite ?? null
  };
  const issuerFromEmail: WorkspaceDocumentParty = {
    name:
      payload.issuerLegalName?.trim() ||
      payload.issuerName?.trim() ||
      counterparty.name,
    email: payload.issuerEmail ?? counterparty.email,
    phone: payload.issuerPhone ?? counterparty.phone,
    address: payload.issuerAddress ?? counterparty.address,
    taxId: payload.issuerTaxId ?? counterparty.taxId,
    website: payload.issuerWebsite ?? counterparty.website
  };
  const billToFromEmail: WorkspaceDocumentParty = {
    name: payload.billToName?.trim() || '',
    email: payload.billToEmail ?? null,
    phone: payload.billToPhone ?? null,
    address: payload.billToAddress ?? null,
    taxId: payload.billToTaxId ?? null,
    website: null
  };

  const seller = isInvoice ? issuerFromEmail : workspace;
  const buyer = isInvoice
    ? coalesceParty(billToFromEmail, workspace)
    : coalesceParty(billToFromEmail, counterparty);

  const supply = payload.supplyAt ? new Date(payload.supplyAt) : null;
  const dueAt = input.dueAt ?? addDays(input.issuedAt, 30);
  const cleanedLines = lines.map((line) => ({
    ...line,
    description: cleanLineDescription(
      line.description,
      input.counterpartyName,
      payload.subject ?? null
    )
  }));
  const displayReference = payload.originalReference || input.reference;
  const issuerLogoUrl = isInvoice
    ? (payload.issuerLogoUrl ??
      resolveMailBrandLogoUrl(seller.website, seller.email))
    : input.brand.logoUrl;

  return {
    kind: input.kind,
    title,
    reference: input.reference,
    originalReference: payload.originalReference ?? null,
    status: input.status,
    currency: input.currency,
    issuedAt: input.issuedAt,
    supplyAt:
      supply && !Number.isNaN(supply.getTime()) ? supply : input.issuedAt,
    dueAt,
    paymentTerms:
      payload.paymentTerms ??
      (isInvoice
        ? 'Payment due within 30 days of the invoice date.'
        : 'This quote is valid for 30 days.'),
    paymentDetails: payload.paymentDetails ?? null,
    notes: payload.notes ?? null,
    seller,
    buyer,
    issuerLogoUrl,
    displayReference,
    lines: cleanedLines,
    subtotalCents,
    taxAmountCents,
    taxRatePercent: payload.taxRatePercent ?? null,
    totalCents,
    taxNote,
    quoteNotice: isInvoice
      ? null
      : 'This quotation is not a tax invoice. A tax invoice will be issued on acceptance.'
  };
}
