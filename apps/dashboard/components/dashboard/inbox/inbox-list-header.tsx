'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RefreshCwIcon } from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { syncInboxNow } from '@/actions/inbox/sync-inbox-now';
import { Button } from '@/components/ui/button';
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
  className
}: {
  activeFilter?: InboxListFilter;
  activeTagId?: string | null;
  tags?: MailTagItem[];
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
    </div>
  );
}
