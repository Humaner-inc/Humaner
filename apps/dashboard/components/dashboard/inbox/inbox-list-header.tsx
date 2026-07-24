'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RefreshCwIcon } from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { syncInboxNow } from '@/actions/inbox/sync-inbox-now';
import type { MailListSelectionApi } from '@/components/dashboard/inbox/mail-thread-list';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { MailTagItem } from '@/data/inbox/get-mail-threads';
import { cn } from '@/lib/utils';

export type InboxListFilter = 'all' | 'unread' | 'open' | 'pending';

const FILTERS: Array<{ id: InboxListFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'open', label: 'Open' },
  { id: 'pending', label: 'Pending' }
];

export function InboxListHeader({
  activeFilter = 'all',
  activeTagId = null,
  tags = [],
  selection,
  className
}: {
  activeFilter?: InboxListFilter;
  activeTagId?: string | null;
  tags?: MailTagItem[];
  selection?: MailListSelectionApi;
  className?: string;
}): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { execute, isExecuting } = useAction(syncInboxNow, {
    onSuccess: ({ data }) => {
      const imported = data?.messages ?? 0;
      toast.success(
        imported > 0
          ? `Mailbox synced — ${imported} message${imported === 1 ? '' : 's'} checked`
          : 'Mailbox is up to date'
      );
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not sync mailbox');
    }
  });

  const hrefFor = (next: {
    filter?: InboxListFilter | null;
    tagId?: string | null;
  }): string => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.filter !== undefined) {
      if (!next.filter || next.filter === 'all') {
        params.delete('filter');
      } else {
        params.set('filter', next.filter);
      }
      params.delete('tag');
    }

    if (next.tagId !== undefined) {
      if (!next.tagId) {
        params.delete('tag');
      } else {
        params.set('tag', next.tagId);
        params.delete('filter');
      }
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const hasSelection = Boolean(selection && selection.selectedCount > 0);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border bg-background px-2 py-1.5 sm:gap-3 sm:px-3',
        className
      )}
    >
      {selection ? (
        <>
          <Checkbox
            checked={
              selection.allSelected
                ? true
                : selection.someSelected
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={() => selection.toggleAll()}
            aria-label="Select all conversations"
            data-no-pull
          />
          <div
            className="hidden h-4 w-px bg-border sm:block"
            aria-hidden
          />
        </>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        disabled={isExecuting}
        title="Sync mailbox"
        onClick={() => execute({})}
      >
        <RefreshCwIcon
          className={cn('size-3.5', isExecuting && 'animate-spin')}
        />
        <span className="sr-only">
          {isExecuting ? 'Syncing' : 'Sync mailbox'}
        </span>
      </Button>

      <div
        className="hidden h-4 w-px bg-border sm:block"
        aria-hidden
      />

      {hasSelection && selection ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {selection.selectedCount} selected
          </span>
          {selection.tags.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-none font-mono text-[10px]"
                >
                  Label
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => selection.tagSelected(null)}>
                  No tag
                </DropdownMenuItem>
                {selection.tags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onSelect={() => selection.tagSelected(tag.id)}
                  >
                    <span
                      className="mr-2 size-2.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-none font-mono text-[10px]"
              >
                Assign
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => selection.assignSelected(null)}>
                Unassigned
              </DropdownMenuItem>
              {selection.members.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  onSelect={() => selection.assignSelected(member.id)}
                >
                  {member.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-none font-mono text-[10px]"
            onClick={selection.archiveSelected}
          >
            {selection.archivedView ? 'Move to inbox' : 'Archive'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-none font-mono text-[10px]"
            onClick={selection.askDeleteSelected}
          >
            Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-none font-mono text-[10px]"
            onClick={selection.clearSelection}
          >
            Clear
          </Button>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {FILTERS.map((filter) => {
            const active = !activeTagId && activeFilter === filter.id;
            return (
              <Link
                key={filter.id}
                href={hrefFor({ filter: filter.id })}
                className={cn(
                  'rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {filter.label}
              </Link>
            );
          })}

          {tags.length > 0 ? (
            <>
              <div
                className="mx-1 hidden h-4 w-px bg-border sm:block"
                aria-hidden
              />
              {tags.map((tag) => {
                const active = activeTagId === tag.id;
                return (
                  <Link
                    key={tag.id}
                    href={hrefFor({ tagId: active ? null : tag.id })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                      active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Link>
                );
              })}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
