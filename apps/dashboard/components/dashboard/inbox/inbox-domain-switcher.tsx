'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckIcon, ChevronDownIcon } from '@humaner/shared/icons';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { groupMailInboxes } from '@/lib/inbox/mail-inbox-groups';
import { cn } from '@/lib/utils';

function formatUnreadCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function InboxDomainSwitcher({
  inboxes,
  activeMailboxId
}: {
  inboxes: MailInboxOption[];
  activeMailboxId: string | null;
}): React.JSX.Element | null {
  const pathname = usePathname();
  const mailboxes = React.useMemo(() => groupMailInboxes(inboxes), [inboxes]);

  if (mailboxes.length === 0) return null;

  const active =
    mailboxes.find((mailbox) => mailbox.connectionId === activeMailboxId) ??
    mailboxes[0] ??
    null;
  const single = mailboxes[0];
  const label = active?.email ?? single.email;

  if (mailboxes.length === 1) {
    return (
      <p
        className="max-w-72 truncate font-mono text-xs text-muted-foreground"
        title={`${single.email} · ${single.providerName}`}
      >
        {single.email}
      </p>
    );
  }

  const hrefFor = (connectionId: string): string => {
    return `${pathname}?mailbox=${connectionId}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 max-w-72 gap-1.5 px-2 font-mono text-xs text-muted-foreground"
          title={label}
        >
          <span className="truncate">{label}</span>
          {active && active.unreadCount > 0 ? (
            <span className="shrink-0 tabular-nums text-[#001afc]">
              {formatUnreadCount(active.unreadCount)}
            </span>
          ) : null}
          <ChevronDownIcon className="size-3.5 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80 p-1"
      >
        <p className="px-2.5 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Mailboxes
        </p>
        {mailboxes.map((mailbox) => {
          const selected =
            (activeMailboxId ?? mailboxes[0]?.connectionId) ===
            mailbox.connectionId;
          return (
            <DropdownMenuItem
              key={mailbox.connectionId}
              asChild
              className={cn(
                'cursor-pointer rounded-lg px-2.5 py-2 focus:bg-foreground/[0.06] focus:text-popover-foreground data-[highlighted]:bg-foreground/[0.06] data-[highlighted]:text-popover-foreground',
                selected && 'bg-foreground/[0.04]'
              )}
            >
              <Link
                href={hrefFor(mailbox.connectionId)}
                aria-current={selected ? 'true' : undefined}
                className="flex w-full items-center gap-3"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate font-mono text-xs',
                      selected ? 'text-foreground' : 'text-foreground/85'
                    )}
                  >
                    {mailbox.email}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] font-normal text-muted-foreground">
                    {mailbox.providerName}
                  </span>
                </span>
                {/* Fixed columns keep counts and check marks aligned across rows. */}
                <span className="min-w-6 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {mailbox.unreadCount > 0
                    ? formatUnreadCount(mailbox.unreadCount)
                    : ''}
                </span>
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {selected ? (
                    <CheckIcon className="size-3.5 text-emerald-600" />
                  ) : null}
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
