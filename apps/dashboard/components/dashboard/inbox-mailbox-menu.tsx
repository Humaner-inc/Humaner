'use client';

import * as React from 'react';
import Link from 'next/link';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { Check } from '@phosphor-icons/react/dist/ssr/Check';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import {
  MAILBOX_FOLDER_ITEMS,
  mailboxConnectionHref,
  type MailboxFolderId
} from '@/constants/mailbox-nav-items';
import { Routes } from '@/constants/routes';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import type { MailMailboxGroup } from '@/lib/inbox/mail-inbox-groups';
import { cn } from '@/lib/utils';

function CountBadge({ count }: { count: number }): React.JSX.Element {
  return (
    <span className="inline-flex min-w-4 items-center justify-center font-mono text-[9px] leading-4 text-[#2252bc]">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function InboxMailboxMenu({
  mailboxes,
  activeMailboxId,
  activeFolder,
  locked
}: {
  mailboxes: MailMailboxGroup[];
  activeMailboxId: string | null;
  activeFolder: MailboxFolderId | null;
  locked: boolean;
}): React.JSX.Element {
  const { state } = useSidebar();
  if (state === 'collapsed') {
    return <></>;
  }

  const activeMailbox =
    mailboxes.find((mailbox) => mailbox.connectionId === activeMailboxId) ??
    mailboxes[0] ??
    null;
  const folderHref =
    MAILBOX_FOLDER_ITEMS.find((item) => item.id === activeFolder)?.href ??
    Routes.InboxAll;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={locked}
        aria-label="Switch inbox"
        className={cn(
          'mx-0.5 flex w-[calc(100%-0.25rem)] items-center gap-1.5 px-2.5 py-1.5 text-left outline-none',
          dashboardRadiusClassName,
          'font-fellix text-sm font-light text-sidebar-foreground/50',
          'transition-colors hover:bg-muted/20 hover:text-sidebar-foreground',
          'focus-visible:text-sidebar-foreground',
          'disabled:pointer-events-none disabled:opacity-40'
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {activeMailbox?.email ?? 'Inbox'}
        </span>
        {activeMailbox && activeMailbox.unreadCount > 0 ? (
          <CountBadge count={activeMailbox.unreadCount} />
        ) : null}
        <CaretDown
          className="size-3 shrink-0"
          weight="bold"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className="min-w-56"
      >
        {mailboxes.map((mailbox) => {
          const selected = mailbox.connectionId === activeMailboxId;
          return (
            <DropdownMenuItem
              key={mailbox.connectionId}
              asChild
            >
              <Link
                href={mailboxConnectionHref(folderHref, mailbox.connectionId)}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    'size-3.5 shrink-0',
                    selected ? 'opacity-100' : 'opacity-0'
                  )}
                  weight="bold"
                />
                <span className="min-w-0 flex-1 truncate">{mailbox.email}</span>
                {mailbox.unreadCount > 0 ? (
                  <CountBadge count={mailbox.unreadCount} />
                ) : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
