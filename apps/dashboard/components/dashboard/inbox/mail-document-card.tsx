'use client';

import * as React from 'react';
import {
  ArrowDownIcon,
  ReceiptIcon,
  ScrollTextIcon
} from '@humaner/shared/icons';

import { IssuerLegalMark } from '@/components/dashboard/inbox/issuer-legal-mark';
import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import type { MailWorkspaceDocumentSummary } from '@/data/inbox/get-mail-threads';
import { mailDocumentDownloadPath } from '@/lib/inbox/mail-document-format';
import { resolveMailBrandLogoUrl } from '@/lib/inbox/resolve-mail-brand-logo';
import { cn } from '@/lib/utils';

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function statusLabel(status: string): string {
  if (status === 'DRAFT') return 'Pending';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function MailDocumentCard({
  document,
  brand
}: {
  document: MailWorkspaceDocumentSummary;
  brand: {
    name: string;
    email?: string | null;
    logoUrl?: string | null;
    address?: string | null;
    phone?: string | null;
    taxId?: string | null;
  };
}): React.JSX.Element {
  const listHref =
    document.kind === 'QUOTE'
      ? Routes.ResourcesQuotes
      : Routes.ResourcesInvoices;
  const isInvoice = document.kind === 'INVOICE';
  const KindIcon = isInvoice ? ReceiptIcon : ScrollTextIcon;
  const vendorLogo = isInvoice
    ? resolveMailBrandLogoUrl(null, document.counterpartyEmail)
    : null;
  const displayName = isInvoice
    ? document.counterpartyName || brand.name
    : brand.name;
  const displayEmail = isInvoice ? document.counterpartyEmail : brand.email;
  const displayLogo = isInvoice ? vendorLogo : brand.logoUrl;
  const legalProfile = {
    address: brand.address,
    email: brand.email,
    phone: brand.phone,
    taxId: brand.taxId,
    logoUrl: brand.logoUrl
  };

  return (
    <aside
      className={cn(
        'absolute right-5 top-20 z-20 w-[min(100%-2.5rem,20rem)] rounded-2xl border border-border/70 bg-background p-4 shadow-[0_18px_40px_-24px_rgb(10_13_13/0.55)]'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="size-9 overflow-hidden rounded-lg border border-border/60 bg-muted/40">
          {displayLogo ? (
            // eslint-disable-next-line @next/next/no-img-element -- brand mark from logo.dev / workspace
            <img
              src={displayLogo}
              alt=""
              className="size-full object-contain"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[11px] font-medium">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {displayEmail ? (
            <p className="truncate font-info text-xs text-muted-foreground">
              {displayEmail}
            </p>
          ) : null}
        </div>
        <span
          className="text-muted-foreground"
          title={isInvoice ? 'Invoice' : 'Quote'}
        >
          <KindIcon className="size-3.5 shrink-0" />
        </span>
        {isInvoice ? null : (
          <IssuerLegalMark
            profile={legalProfile}
            purpose="issuer"
          />
        )}
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="font-mono text-xs">{document.reference}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Due date</dt>
          <dd>{formatDate(document.dueAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Generated from</dt>
          <dd className="truncate text-right">
            {document.kind === 'QUOTE' ? 'Quote request' : 'Receipt'}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
              {statusLabel(document.status)}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-border/60 pt-2">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium">
            {formatMoney(document.amountCents, document.currency)}
          </dd>
        </div>
      </dl>
      {isInvoice ? (
        <IssuerLegalMark
          profile={legalProfile}
          purpose="billing"
          includeLogo={false}
          showLabel
          className="mt-3"
        />
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 flex-1"
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
    </aside>
  );
}
