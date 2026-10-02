'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TriangleAlertIcon } from '@humaner/shared/icons';

import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import type { MailConnectionAlert } from '@/data/inbox/get-inbox-overview';
import {
  GMAIL_QUOTA_USER_MESSAGE,
  humanizeMailboxSyncError,
  isGmailQuotaErrorMessage
} from '@/lib/inbox/gmail-sync-errors';
import { cn } from '@/lib/utils';

const MAX_ERROR_CHARS = 160;

/** What the teammate has to do, per provider, to bring the mailbox back. */
function alertHeadline(alert: MailConnectionAlert): string {
  const error = alert.lastError ?? '';
  if (isGmailQuotaErrorMessage(error)) {
    return GMAIL_QUOTA_USER_MESSAGE;
  }
  if (alert.status === 'NEEDS_REAUTH') {
    if (alert.provider === 'IMAP') {
      return 'The mail password stopped working — update the credentials.';
    }
    return 'The provider revoked access — reconnect this mailbox.';
  }
  if (alert.status === 'DISCONNECTED') {
    return 'This mailbox is disconnected, so nothing is syncing.';
  }
  return 'The last sync failed for this mailbox.';
}

function alertDetail(alert: MailConnectionAlert): string | null {
  if (!alert.lastError) return null;
  if (isGmailQuotaErrorMessage(alert.lastError)) {
    // Headline already carries the full user message.
    return null;
  }
  const humanized = humanizeMailboxSyncError(alert.lastError);
  if (!humanized) return null;
  return humanized.slice(0, MAX_ERROR_CHARS);
}

export function MailboxConnectionAlerts({
  alerts,
  canManage
}: {
  alerts: MailConnectionAlert[];
  /** Only the workspace owner can fix a connection, so only they see details. */
  canManage: boolean;
}): React.JSX.Element | null {
  const pathname = usePathname();

  if (alerts.length === 0) {
    return null;
  }

  const onProvidersPage = pathname?.startsWith(Routes.InboxProviders) ?? false;

  // A teammate cannot reconnect anything, so they get the fact and nothing else
  // — no mailbox addresses, no provider error text.
  if (!canManage) {
    return (
      <div className="flex shrink-0 items-center gap-3 border-b border-amber-500/25 bg-amber-500/[0.07] px-5 py-3 text-xs text-muted-foreground sm:px-6">
        <TriangleAlertIcon
          className="size-4 shrink-0 text-amber-600"
          strokeWidth={1.5}
        />
        {alerts.length === 1
          ? 'A mailbox stopped syncing. Ask the workspace owner to reconnect it.'
          : `${alerts.length} mailboxes stopped syncing. Ask the workspace owner to reconnect them.`}
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-amber-500/25 bg-amber-500/[0.07] px-5 py-3 sm:px-6">
      <ul className="space-y-2">
        {alerts.map((alert) => {
          const detail = alertDetail(alert);
          const isQuota = isGmailQuotaErrorMessage(alert.lastError ?? '');
          return (
            <li
              key={alert.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
            >
              <TriangleAlertIcon
                className="size-4 shrink-0 text-amber-600"
                strokeWidth={1.5}
              />
              <span className="min-w-0 truncate font-mono text-xs">
                {alert.email}
              </span>
              <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                {alertHeadline(alert)}
                {detail ? ` ${detail}` : ''}
              </span>
              {onProvidersPage || isQuota ? null : (
                <Link
                  href={Routes.InboxProviders}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'h-7 shrink-0 rounded-lg px-2.5 font-mono text-[10px]'
                  )}
                >
                  Fix connection
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
