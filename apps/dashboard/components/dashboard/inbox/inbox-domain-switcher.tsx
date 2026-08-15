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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
    null;
  const totalUnread = mailboxes.reduce(
    (sum, mailbox) => sum + mailbox.unreadCount,
    0
  );
  const single = mailboxes[0];
  const label = active
    ? active.email
    : mailboxes.length === 1
      ? single.email
      : 'All mailboxes';

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

  const hrefFor = (connectionId: string | null): string => {
    if (!connectionId) return pathname;
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
          {!active && totalUnread > 0 ? (
            <span className="shrink-0 tabular-nums text-foreground">
              {formatUnreadCount(totalUnread)}
            </span>
          ) : null}
          {active && active.unreadCount > 0 ? (
            <span className="shrink-0 tabular-nums text-foreground">
              {formatUnreadCount(active.unreadCount)}
            </span>
          ) : null}
          <ChevronDownIcon className="size-3.5 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80"
      >
        <DropdownMenuItem
          asChild
          className={cn(!activeMailboxId && 'bg-accent font-medium')}
        >
          <Link
            href={hrefFor(null)}
            className="flex w-full items-center gap-2"
          >
            <span className="min-w-0 flex-1 truncate">All mailboxes</span>
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {totalUnread > 0 ? (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {formatUnreadCount(totalUnread)}
                </span>
              ) : null}
              {!activeMailboxId ? (
                <CheckIcon className="size-3.5 text-emerald-600" />
              ) : null}
            </span>
          </Link>
        </DropdownMenuItem>
        {mailboxes.map((mailbox) => {
          const selected = activeMailboxId === mailbox.connectionId;
          return (
            <React.Fragment key={mailbox.connectionId}>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                asChild
                className={cn(selected && 'bg-accent font-medium')}
              >
                <Link
                  href={hrefFor(mailbox.connectionId)}
                  className="flex w-full items-start gap-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{mailbox.email}</span>
                    <span className="block truncate text-[10px] font-normal text-muted-foreground">
                      {mailbox.providerName} · inbox
                    </span>
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-2 pt-0.5">
                    {mailbox.unreadCount > 0 ? (
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {formatUnreadCount(mailbox.unreadCount)}
                      </span>
                    ) : null}
                    {selected ? (
                      <CheckIcon className="size-3.5 text-emerald-600" />
                    ) : null}
                  </span>
                </Link>
              </DropdownMenuItem>
              {mailbox.aliases.length > 1 ? (
                <>
                  <DropdownMenuLabel className="font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                    Sending aliases
                  </DropdownMenuLabel>
                  {mailbox.aliases.map((alias) => (
                    <div
                      key={alias.id}
                      className="px-2 py-1 font-mono text-xs text-muted-foreground"
                    >
                      {alias.address}
                    </div>
                  ))}
                </>
              ) : null}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
