'use client';

import * as React from 'react';
import { ArrowDownIcon, XIcon } from '@humaner/shared/icons';

import { IssuerLegalMark } from '@/components/dashboard/inbox/issuer-legal-mark';
import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import type { MailWorkspaceDocumentSummary } from '@/data/inbox/get-mail-threads';
import { mailDocumentDownloadPath } from '@/lib/inbox/mail-document-format';
import {
  buildWorkspaceDocumentView,
  formatDocumentDate,
  formatDocumentMoney,
  formatDocumentQuantity,
  parseWorkspaceDocumentPayload
} from '@/lib/inbox/workspace-document-view';
import { cn } from '@/lib/utils';

function statusLabel(status: string): string {
  if (status === 'DRAFT') return 'Pending';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function statusClass(status: string): string {
  if (status === 'PAID' || status === 'ACCEPTED') {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  }
  if (status === 'VOID' || status === 'DECLINED') {
    return 'bg-muted text-muted-foreground';
  }
  return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
}

export function MailDocumentCard({
  document,
  brand,
  onClose
}: {
  document: MailWorkspaceDocumentSummary;
  brand: {
    name: string;
    email?: string | null;
    logoUrl?: string | null;
    website?: string | null;
    address?: string | null;
    phone?: string | null;
    taxId?: string | null;
  };
  onClose: () => void;
}): React.JSX.Element {
  const listHref =
    document.kind === 'QUOTE'
      ? Routes.ResourcesQuotes
      : Routes.ResourcesInvoices;
  const isInvoice = document.kind === 'INVOICE';
  const payload = parseWorkspaceDocumentPayload(document.payload);
  const view = buildWorkspaceDocumentView({
    kind: document.kind,
    reference: document.reference,
    status: document.status,
    brand: {
      name: brand.name,
      email: brand.email ?? null,
      website: brand.website ?? null,
      logoUrl: brand.logoUrl ?? null,
      accentColor: null,
      address: brand.address ?? null,
      phone: brand.phone ?? null,
      taxId: brand.taxId ?? null
    },
    counterpartyName: document.counterpartyName,
    counterpartyEmail: document.counterpartyEmail,
    amountCents: document.amountCents,
    currency: document.currency,
    issuedAt: new Date(document.issuedAt),
    dueAt: document.dueAt ? new Date(document.dueAt) : null,
    payload: document.payload
  });
  const title = payload.subject?.trim() || view.title;
  const legalProfile = {
    address: brand.address,
    email: brand.email,
    phone: brand.phone,
    taxId: brand.taxId,
    logoUrl: brand.logoUrl
  };

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside
      className={cn(
        'absolute right-5 top-16 z-20 flex max-h-[min(36rem,calc(100%-6rem))] w-[min(100%-2.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_18px_40px_-24px_rgb(10_13_13/0.55)]'
      )}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-display text-lg leading-tight tracking-tight">
            {title}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {view.displayReference}
          </p>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">From</dt>
            <dd className="mt-0.5 truncate font-medium">
              {view.seller.name || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Date</dt>
            <dd className="mt-0.5">
              {formatDocumentDate(view.issuedAt) || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bill to</dt>
            <dd className="mt-0.5 truncate font-medium">
              {view.buyer.name || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {isInvoice ? 'Due' : 'Valid until'}
            </dt>
            <dd className="mt-0.5">{formatDocumentDate(view.dueAt) || '—'}</dd>
          </div>
        </dl>

        <ul className="mt-4 space-y-3 border-t border-border/60 pt-4">
          {view.lines.map((line, index) => {
            const credit = line.totalCents < 0;
            return (
              <li
                key={`${line.description}-${index}`}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">{line.description.split('\n')[0]}</p>
                  {credit ? null : (
                    <p className="text-xs text-muted-foreground">
                      {formatDocumentQuantity(line.quantity)} ×{' '}
                      {formatDocumentMoney(line.unitAmountCents, view.currency)}
                    </p>
                  )}
                </div>
                <p className="shrink-0 tabular-nums">
                  {formatDocumentMoney(line.totalCents, view.currency)}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-dashed border-border/70 pt-3">
          <p className="text-sm text-muted-foreground">
            {isInvoice ? 'Amount due' : 'Total'}
          </p>
          <p className="text-base font-medium tabular-nums">
            {formatDocumentMoney(view.totalCents, view.currency)}
          </p>
        </div>
        {view.taxAmountCents > 0 ? (
          <p className="mt-1 text-right text-xs text-muted-foreground">
            Includes {formatDocumentMoney(view.taxAmountCents, view.currency)}{' '}
            tax
          </p>
        ) : null}

        {isInvoice ? (
          <IssuerLegalMark
            profile={legalProfile}
            purpose="billing"
            includeLogo={false}
            showLabel
            className="mt-3"
          />
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          {isInvoice ? null : (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                statusClass(document.status)
              )}
            >
              {statusLabel(document.status)}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn('h-8', isInvoice ? null : 'ml-auto')}
            onClick={() =>
              window.location.assign(mailDocumentDownloadPath(document.id))
            }
          >
            <ArrowDownIcon className="mr-1.5 size-3.5" />
            Download PDF
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => window.location.assign(listHref)}
          >
            Open
          </Button>
        </div>
      </div>
    </aside>
  );
}
