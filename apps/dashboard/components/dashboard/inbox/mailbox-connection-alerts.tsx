'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TriangleAlertIcon } from '@humaner/shared/icons';

import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import type { MailConnectionAlert } from '@/data/inbox/get-inbox-overview';
import { cn } from '@/lib/utils';

const MAX_ERROR_CHARS = 160;

/** What the teammate has to do, per provider, to bring the mailbox back. */
function alertHeadline(alert: MailConnectionAlert): string {
  if (alert.status === 'NEEDS_REAUTH') {
    return alert.provider === 'GMAIL'
      ? 'Google access expired — reconnect this mailbox.'
      : 'The mail password stopped working — update the credentials.';
  }
  if (alert.status === 'DISCONNECTED') {
    return 'This mailbox is disconnected, so nothing is syncing.';
  }
  return 'The last sync failed for this mailbox.';
}

export function MailboxConnectionAlerts({
  alerts
}: {
  alerts: MailConnectionAlert[];
}): React.JSX.Element | null {
  const pathname = usePathname();

  if (alerts.length === 0) {
    return null;
  }

  const onProvidersPage = pathname?.startsWith(Routes.InboxProviders) ?? false;

  return (
    <div className="shrink-0 border-b border-amber-500/25 bg-amber-500/[0.07] px-5 py-3 sm:px-6">
      <ul className="space-y-2">
        {alerts.map((alert) => (
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
              {alert.lastError
                ? ` ${alert.lastError.slice(0, MAX_ERROR_CHARS)}`
                : ''}
            </span>
            {onProvidersPage ? null : (
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
        ))}
      </ul>
    </div>
  );
}
