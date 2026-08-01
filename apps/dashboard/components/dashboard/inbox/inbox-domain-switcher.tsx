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
import { cn } from '@/lib/utils';

function formatUnreadCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function InboxDomainSwitcher({
  inboxes,
  activeAliasId
}: {
  inboxes: MailInboxOption[];
  activeAliasId: string | null;
}): React.JSX.Element | null {
  const pathname = usePathname();

  if (inboxes.length === 0) return null;

  const active = inboxes.find((inbox) => inbox.id === activeAliasId) ?? null;
  const singleLabel = inboxes[0]?.address ?? '';
  const multiLabel = active?.address ?? 'All inboxes';
  const totalUnread = inboxes.reduce(
    (sum, inbox) => sum + inbox.unreadCount,
    0
  );

  if (inboxes.length === 1) {
    return (
      <p
        className="max-w-72 truncate text-right font-mono text-xs text-muted-foreground"
        title={singleLabel}
      >
        {singleLabel}
      </p>
    );
  }

  const hrefFor = (aliasId: string | null): string => {
    if (!aliasId) return pathname;
    return `${pathname}?alias=${aliasId}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 max-w-72 gap-1.5 px-2 font-mono text-xs text-muted-foreground"
          title={multiLabel}
        >
          <span className="truncate">{multiLabel}</span>
          {!activeAliasId && totalUnread > 0 ? (
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
        align="end"
        className="w-72"
      >
        <DropdownMenuItem
          asChild
          className={cn(!activeAliasId && 'bg-accent font-medium')}
        >
          <Link
            href={hrefFor(null)}
            className="flex w-full items-center gap-2"
          >
            <span className="min-w-0 flex-1 truncate">All inboxes</span>
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {totalUnread > 0 ? (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {formatUnreadCount(totalUnread)}
                </span>
              ) : null}
              {!activeAliasId ? (
                <CheckIcon className="size-3.5 text-emerald-600" />
              ) : null}
            </span>
          </Link>
        </DropdownMenuItem>
        {inboxes.map((inbox) => {
          const selected = activeAliasId === inbox.id;
          return (
            <DropdownMenuItem
              key={inbox.id}
              asChild
              className={cn(selected && 'bg-accent font-medium')}
            >
              <Link
                href={hrefFor(inbox.id)}
                className="flex w-full items-center gap-2"
              >
                <span className="min-w-0 flex-1 truncate">{inbox.address}</span>
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  {inbox.unreadCount > 0 ? (
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {formatUnreadCount(inbox.unreadCount)}
                    </span>
                  ) : null}
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
