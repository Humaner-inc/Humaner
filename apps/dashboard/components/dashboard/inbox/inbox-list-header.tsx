'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CheckIcon,
  ChevronDownIcon,
  RefreshCwIcon
} from '@humaner/shared/icons';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import { AnimatePresence, motion } from 'motion/react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { syncInboxNow } from '@/actions/inbox/sync-inbox-now';
import { AssigneeMenuItems } from '@/components/dashboard/assignee-options';
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
  { id: 'pending', label: 'In progress' }
];

const INBOX_BULK_DELETE_BUTTON_CLASS =
  'h-8 font-mono text-[10px] hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive';

const PANEL_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const
};

/** Lowercase like the hint popup, set in Geist Mono. */
const CHIP_CLASS =
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 font-mono text-[11px] font-normal leading-none tracking-[0.02em] lowercase transition-colors';

type FilterChipItem = {
  key: string;
  href: string;
  label: string;
  active: boolean;
  color?: string;
};

function chipTone(active: boolean): string {
  return active
    ? 'bg-foreground/[0.06] text-foreground'
    : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground';
}

function ChipFace({ item }: { item: FilterChipItem }): React.JSX.Element {
  return (
    <>
      {item.color ? (
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
      ) : null}
      {item.label}
    </>
  );
}

function FilterChip({ item }: { item: FilterChipItem }): React.JSX.Element {
  return (
    <Link
      href={item.href}
      className={cn(CHIP_CLASS, chipTone(item.active))}
    >
      <ChipFace item={item} />
    </Link>
  );
}

function splitVisibleChips(
  items: FilterChipItem[],
  visibleCount: number
): { visible: FilterChipItem[]; overflow: FilterChipItem[] } {
  if (visibleCount >= items.length) {
    return { visible: items, overflow: [] };
  }

  const count = Math.max(0, visibleCount);
  const activeIndex = items.findIndex((item) => item.active);
  let visible = items.slice(0, count);

  if (activeIndex >= count && count > 0) {
    visible = [...items.slice(0, count - 1), items[activeIndex]];
  }

  const visibleKeys = new Set(visible.map((item) => item.key));
  return {
    visible,
    overflow: items.filter((item) => !visibleKeys.has(item.key))
  };
}

function InboxFilterOverflow({
  items
}: {
  items: FilterChipItem[];
}): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(items.length);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const update = (): void => {
      const chips = Array.from(
        measure.querySelectorAll<HTMLElement>('[data-filter-chip]')
      );
      const more = measure.querySelector<HTMLElement>('[data-filter-more]');
      if (chips.length === 0) {
        setVisibleCount(0);
        return;
      }

      const gap = Number.parseFloat(getComputedStyle(measure).columnGap) || 4;
      const moreWidth = more?.offsetWidth ?? 0;
      const widths = chips.map((chip) => chip.offsetWidth);
      const full =
        widths.reduce((sum, width) => sum + width, 0) +
        gap * Math.max(0, widths.length - 1);

      if (full <= container.clientWidth) {
        setVisibleCount(widths.length);
        return;
      }

      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const next = used + (count > 0 ? gap : 0) + widths[i];
        const remaining = widths.length - (i + 1);
        const withMore = next + (remaining > 0 ? gap + moreWidth : 0);
        if (withMore > container.clientWidth) break;
        used = next;
        count += 1;
      }

      setVisibleCount(count);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [items]);

  const { visible, overflow } = splitVisibleChips(items, visibleCount);
  const overflowActive = overflow.some((item) => item.active);

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-y-0 left-0 flex items-center gap-1"
      >
        {items.map((item) => (
          <span
            key={item.key}
            data-filter-chip
            className={cn(CHIP_CLASS, chipTone(item.active))}
          >
            <ChipFace item={item} />
          </span>
        ))}
        <span
          data-filter-more
          className={cn(CHIP_CLASS, 'px-1.5')}
        >
          <ChevronDownIcon className="size-3.5" />
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex min-w-0 items-center gap-1 overflow-hidden"
      >
        {visible.map((item) => (
          <FilterChip
            key={item.key}
            item={item}
          />
        ))}
        {overflow.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(CHIP_CLASS, 'px-1.5', chipTone(overflowActive))}
                aria-label="More filters"
              >
                <ChevronDownIcon className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {overflow.map((item) => (
                <DropdownMenuItem
                  key={item.key}
                  asChild
                >
                  <Link
                    href={item.href}
                    className="font-mono text-[11px] font-normal leading-none tracking-[0.02em] lowercase"
                  >
                    {item.color ? (
                      <span
                        className="mr-2 size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    ) : null}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}

export function InboxListHeader({
  activeFilter = 'all',
  activeTagId = null,
  activeMailboxId = null,
  tags = [],
  selection,
  showFilters = true,
  className
}: {
  activeFilter?: InboxListFilter;
  activeTagId?: string | null;
  activeMailboxId?: string | null;
  tags?: MailTagItem[];
  selection?: MailListSelectionApi;
  /** Status and tag chips only apply to the inbox list; other folders hide them. */
  showFilters?: boolean;
  className?: string;
}): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [synced, setSynced] = React.useState(false);
  const syncedFrameRef = React.useRef<number | null>(null);
  const syncedTimerRef = React.useRef<number | null>(null);

  const clearSyncedTimer = React.useCallback(() => {
    if (syncedFrameRef.current !== null) {
      window.cancelAnimationFrame(syncedFrameRef.current);
      syncedFrameRef.current = null;
    }
    if (syncedTimerRef.current !== null) {
      window.clearTimeout(syncedTimerRef.current);
      syncedTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => clearSyncedTimer, [clearSyncedTimer]);

  const showSynced = React.useCallback(() => {
    clearSyncedTimer();
    syncedFrameRef.current = window.requestAnimationFrame(() => {
      syncedFrameRef.current = null;
      setSynced(true);
      syncedTimerRef.current = window.setTimeout(() => {
        syncedTimerRef.current = null;
        setSynced(false);
      }, 2000);
    });
  }, [clearSyncedTimer]);

  const { execute, isExecuting } = useAction(syncInboxNow, {
    onSuccess: ({ data }) => {
      const imported = data?.messages ?? 0;
      const syncErrors = data?.errors ?? 0;
      if (syncErrors > 0 && imported === 0) {
        toast.error('Mailbox sync hit an error. Try again in a few minutes.');
      } else {
        showSynced();
        toast.success(
          imported > 0
            ? `Mailbox synced — ${imported} message${imported === 1 ? '' : 's'} checked`
            : 'Mailbox is up to date'
        );
      }
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
    if (activeMailboxId) {
      params.set('mailbox', activeMailboxId);
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

  const filterItems = React.useMemo<FilterChipItem[]>(
    () => {
      const statusItems = FILTERS.map((filter) => ({
        key: filter.id,
        href: hrefFor({ filter: filter.id }),
        label: filter.label,
        active: !activeTagId && activeFilter === filter.id,
        color: filter.id === 'unread' ? '#001afc' : undefined
      }));
      const tagItems = tags.map((tag) => ({
        key: tag.id,
        href: hrefFor({ tagId: activeTagId === tag.id ? null : tag.id }),
        label: tag.name,
        active: activeTagId === tag.id,
        color: tag.color
      }));
      const unreadIndex = statusItems.findIndex(
        (item) => item.key === 'unread'
      );
      const insertAt = unreadIndex >= 0 ? unreadIndex + 1 : statusItems.length;

      return [
        ...statusItems.slice(0, insertAt),
        ...tagItems,
        ...statusItems.slice(insertAt)
      ];
    },
    // hrefFor is rebuilt from the current route + selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeMailboxId, activeFilter, activeTagId, pathname, tags]
  );

  return (
    <div
      className={cn(
        'flex flex-nowrap items-center gap-2 overflow-hidden px-2 py-1.5 sm:gap-3 sm:px-3',
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-lg"
        disabled={isExecuting}
        title={synced ? 'Mailbox synced' : 'Sync mailbox'}
        onClick={() => {
          setSynced(false);
          clearSyncedTimer();
          execute({});
        }}
      >
        {isExecuting ? (
          <SquircleLoader />
        ) : (
          <span
            className="t-icon-swap place-items-center"
            data-state={synced ? 'b' : 'a'}
          >
            <span
              className="t-icon"
              data-icon="a"
            >
              <RefreshCwIcon className="size-3.5" />
            </span>
            <span
              className="t-icon"
              data-icon="b"
            >
              <CheckIcon className="size-3.5" />
            </span>
          </span>
        )}
        <span className="sr-only">
          {isExecuting ? 'Syncing' : synced ? 'Mailbox synced' : 'Sync mailbox'}
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
                      className="h-8 font-mono text-[10px]"
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
                    className="h-8 font-mono text-[10px]"
                    disabled={selection.selectedCount === 0}
                  >
                    Assign
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  matchTrigger
                >
                  <AssigneeMenuItems
                    members={selection.members}
                    value={null}
                    includeCompanion
                    onSelect={(assigneeId) =>
                      selection.assignSelected(assigneeId)
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
              {selection.folderView !== 'drafts' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 font-mono text-[10px]"
                  disabled={selection.selectedCount === 0}
                  onClick={selection.archiveSelected}
                >
                  {selection.folderView === 'archive'
                    ? 'Move to inbox'
                    : 'Archive'}
                </Button>
              ) : null}
              {selection.folderView !== 'sent' &&
              selection.folderView !== 'archive' &&
              selection.folderView !== 'drafts' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 font-mono text-[10px]"
                  disabled={selection.selectedCount === 0}
                  onClick={selection.spamSelected}
                >
                  Spam
                </Button>
              ) : null}
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
                className="h-8 font-mono text-[10px]"
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
              className="flex min-w-0 flex-1 items-center gap-1"
            >
              {showFilters ? (
                <InboxFilterOverflow items={filterItems} />
              ) : (
                <div className="min-w-0 flex-1" />
              )}

              {selection ? (
                <button
                  type="button"
                  className={cn(CHIP_CLASS, chipTone(false), 'shrink-0')}
                  onClick={selection.enterSelectMode}
                >
                  Select
                </button>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
