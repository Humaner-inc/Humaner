'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RefreshCwIcon } from '@humaner/shared/icons';
import { AnimatePresence, motion } from 'motion/react';
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

const INBOX_BULK_DELETE_BUTTON_CLASS =
  'h-8 rounded-none font-mono text-[10px] hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive';

const PANEL_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const
};

export function InboxListHeader({
  activeFilter = 'all',
  activeTagId = null,
  activeAliasId = null,
  tags = [],
  selection,
  className
}: {
  activeFilter?: InboxListFilter;
  activeTagId?: string | null;
  activeAliasId?: string | null;
  tags?: MailTagItem[];
  selection?: MailListSelectionApi;
  className?: string;
}): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

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
    const params = new URLSearchParams();
    if (activeAliasId) {
      params.set('alias', activeAliasId);
    }

    if (next.filter !== undefined) {
      if (next.filter && next.filter !== 'all') {
        params.set('filter', next.filter);
      }
    } else if (next.tagId !== undefined) {
      if (next.tagId) {
        params.set('tag', next.tagId);
      }
    } else if (activeTagId) {
      params.set('tag', activeTagId);
    } else if (activeFilter !== 'all') {
      params.set('filter', activeFilter);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const hasSelection = Boolean(selection?.selectMode);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border bg-background px-2 py-1.5 sm:gap-3 sm:px-3',
        className
      )}
    >
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

      <div className="relative flex min-h-8 min-w-0 flex-1 items-center overflow-hidden">
        <AnimatePresence
          mode="popLayout"
          initial={false}
        >
          {hasSelection && selection ? (
            <motion.div
              key="selection-actions"
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={PANEL_TRANSITION}
              className="flex min-w-0 flex-wrap items-center gap-1.5"
            >
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
                      disabled={selection.selectedCount === 0}
                    >
                      Label
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onSelect={() => selection.tagSelected(null)}
                    >
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
                    disabled={selection.selectedCount === 0}
                  >
                    Assign
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onSelect={() => selection.assignSelected(null)}
                  >
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
                disabled={selection.selectedCount === 0}
                onClick={selection.archiveSelected}
              >
                {selection.archivedView ? 'Move to inbox' : 'Archive'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={INBOX_BULK_DELETE_BUTTON_CLASS}
                disabled={selection.selectedCount === 0}
                onClick={selection.askDeleteSelected}
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-none font-mono text-[10px]"
                onClick={selection.clearSelection}
              >
                Cancel
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="filters"
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={PANEL_TRANSITION}
              className="flex min-w-0 flex-wrap items-center gap-1"
            >
              {FILTERS.map((filter) => {
                const active = !activeTagId && activeFilter === filter.id;
                return (
                  <Link
                    key={filter.id}
                    href={hrefFor({ filter: filter.id })}
                    className={cn(
                      'rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                      active
                        ? 'bg-foreground/[0.06] text-foreground'
                        : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
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
                            ? 'bg-foreground/[0.06] text-foreground'
                            : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
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

              {selection ? (
                <>
                  <div
                    className="mx-1 hidden h-4 w-px bg-border sm:block"
                    aria-hidden
                  />
                  <button
                    type="button"
                    className="rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                    onClick={selection.enterSelectMode}
                  >
                    Select
                  </button>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
