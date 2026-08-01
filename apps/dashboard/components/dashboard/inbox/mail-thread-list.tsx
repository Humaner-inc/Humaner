'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  UserPlus2Icon
} from '@humaner/shared/icons';
import { formatDistanceToNow } from 'date-fns';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { fetchMailThread } from '@/actions/inbox/get-mail-thread';
import {
  applyMailThreadTag,
  archiveMailThread,
  assignMailThread,
  bulkApplyMailThreadTag,
  bulkArchiveMailThreads,
  bulkAssignMailThreads,
  bulkDeleteMailThreads,
  markMailThreadRead
} from '@/actions/inbox/manage-mail-thread';
import {
  DeleteMailThreadsDialog,
  readSkipDeleteWarning,
  requestMailDelete
} from '@/components/dashboard/inbox/delete-mail-threads-dialog';
import { MAIL_SPLIT_ROW_HEIGHT_CLASS } from '@/components/dashboard/inbox/mail-split-layout';
import { MailThreadDetail } from '@/components/dashboard/inbox/mail-thread-detail';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';
import { SkillzCubeLoader } from '@/components/ui/skillz-cube-loader';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import type {
  MailTagItem,
  MailThreadDetail as MailThreadDetailDto,
  MailThreadListItem
} from '@/data/inbox/get-mail-threads';
import { tagsForAlias, tagsForAliasIds } from '@/lib/inbox/mail-tag-scope';
import { getLogoUrl } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

const DEFAULT_UNREAD = '#0682de';

function senderDomain(email: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase() || null;
}

function senderLabel(thread: MailThreadListItem): string {
  return thread.fromName || thread.fromAddress || thread.aliasAddress;
}

function stopRowEvent(event: React.SyntheticEvent): void {
  event.stopPropagation();
}

function ReadCircle({
  unread,
  color
}: {
  unread: boolean;
  color: string;
}): React.JSX.Element {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={
        unread
          ? { backgroundColor: color }
          : {
              boxShadow: `inset 0 0 0 1.5px ${color}`,
              backgroundColor: 'transparent'
            }
      }
      aria-hidden
    />
  );
}

export type MailListSelectionApi = {
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  toggleAll: () => void;
  clearSelection: () => void;
  askDeleteSelected: () => void;
  archiveSelected: () => void;
  assignSelected: (assigneeId: string | null) => void;
  tagSelected: (tagId: string | null) => void;
  tags: MailTagItem[];
  members: Array<{ id: string; name: string }>;
  archivedView: boolean;
};

export function MailThreadList({
  threads,
  tags = [],
  members = [],
  archivedView = false,
  selectionHeader
}: {
  threads: MailThreadListItem[];
  tags?: MailTagItem[];
  members?: Array<{ id: string; name: string }>;
  archivedView?: boolean;
  selectionHeader?: (selection: MailListSelectionApi) => React.ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    null
  );
  const activeThreadIdRef = React.useRef<string | null>(null);
  const [paneThread, setPaneThread] =
    React.useState<MailThreadDetailDto | null>(null);
  const [paneLoading, setPaneLoading] = React.useState(false);
  const detailCacheRef = React.useRef(new Map<string, MailThreadDetailDto>());

  React.useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [skipDeleteWarning, setSkipDeleteWarning] = React.useState(false);
  /** Optimistic read/time updates after opening a thread until refresh lands. */
  const [localOverrides, setLocalOverrides] = React.useState<
    Record<
      string,
      { isUnread?: boolean; awaitingReply?: boolean; lastMessageAt?: string }
    >
  >({});

  const markThreadOpened = React.useCallback((threadId: string) => {
    setLocalOverrides((current) => ({
      ...current,
      [threadId]: {
        ...current[threadId],
        isUnread: false,
        awaitingReply: false,
        lastMessageAt: new Date().toISOString()
      }
    }));
  }, []);

  const clearPane = React.useCallback(() => {
    activeThreadIdRef.current = null;
    setActiveThreadId(null);
    setPaneThread(null);
    setPaneLoading(false);
  }, []);

  const { execute: loadThread } = useAction(fetchMailThread, {
    onSuccess: ({ data, input }) => {
      if (!data || input.threadId !== activeThreadIdRef.current) return;
      detailCacheRef.current.set(input.threadId, data);
      setPaneThread(data);
      setPaneLoading(false);
      markThreadOpened(input.threadId);
    },
    onError: ({ error, input }) => {
      if (input.threadId !== activeThreadIdRef.current) return;
      setPaneLoading(false);
      setPaneThread(null);
      toast.error(error.serverError || 'Could not open thread');
    }
  });

  const selectThread = React.useCallback(
    (threadId: string) => {
      activeThreadIdRef.current = threadId;
      setActiveThreadId(threadId);
      const cached = detailCacheRef.current.get(threadId);
      if (cached) {
        setPaneThread(cached);
        setPaneLoading(false);
        markThreadOpened(threadId);
        return;
      }
      setPaneThread(null);
      setPaneLoading(true);
      loadThread({ threadId });
    },
    [loadThread, markThreadOpened]
  );

  React.useEffect(() => {
    setSkipDeleteWarning(readSkipDeleteWarning());
  }, []);

  React.useEffect(() => {
    const valid = new Set(threads.map((thread) => thread.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => valid.has(id)));
      return next.size === current.size ? current : next;
    });
    if (activeThreadId && !valid.has(activeThreadId)) {
      clearPane();
    }
    for (const id of detailCacheRef.current.keys()) {
      if (!valid.has(id)) {
        detailCacheRef.current.delete(id);
      }
    }
  }, [threads, activeThreadId, clearPane]);

  React.useEffect(() => {
    setLocalOverrides((current) => {
      let changed = false;
      const next = { ...current };
      const valid = new Set(threads.map((thread) => thread.id));

      for (const id of Object.keys(next)) {
        if (!valid.has(id)) {
          delete next[id];
          changed = true;
        }
      }

      for (const thread of threads) {
        const override = next[thread.id];
        if (!override) continue;
        const unreadCaughtUp = !thread.isUnread;
        const timeCaughtUp =
          !override.lastMessageAt ||
          new Date(thread.lastMessageAt).getTime() >=
            new Date(override.lastMessageAt).getTime() - 2000;
        if (unreadCaughtUp && timeCaughtUp) {
          delete next[thread.id];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [threads]);

  // After a reply/refresh, drop cached detail so the pane reloads fresh content.
  React.useEffect(() => {
    if (!activeThreadId) return;
    const listItem = threads.find((thread) => thread.id === activeThreadId);
    if (!listItem) return;
    const cached = detailCacheRef.current.get(activeThreadId);
    if (!cached) return;
    if (
      listItem.messageCount !== cached.messages.length ||
      listItem.lastMessageAt !== cached.lastMessageAt
    ) {
      detailCacheRef.current.delete(activeThreadId);
      setPaneLoading(true);
      loadThread({ threadId: activeThreadId });
    }
  }, [threads, activeThreadId, loadThread]);

  const allSelected = threads.length > 0 && selectedIds.size === threads.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < threads.length;
  const selectedList = React.useMemo(() => [...selectedIds], [selectedIds]);

  const toggleOne = React.useCallback((threadId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(threadId);
      else next.delete(threadId);
      return next;
    });
  }, []);

  const toggleAll = React.useCallback(() => {
    setSelectedIds((current) => {
      if (threads.length > 0 && current.size === threads.length) {
        return new Set();
      }
      return new Set(threads.map((thread) => thread.id));
    });
  }, [threads]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const { execute: runBulkArchive } = useAction(bulkArchiveMailThreads, {
    onSuccess: ({ data }) => {
      toast.success(
        archivedView
          ? `Moved ${data?.count ?? selectedList.length} to inbox`
          : `Archived ${data?.count ?? selectedList.length}`
      );
      clearSelection();
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not update threads')
  });

  const { execute: runBulkDelete } = useAction(bulkDeleteMailThreads, {
    onSuccess: ({ data }) => {
      toast.success(`Deleted ${data?.count ?? deleteIds.length}`);
      clearSelection();
      setDeleteOpen(false);
      setDeleteIds([]);
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not delete threads')
  });

  const { execute: runBulkAssign } = useAction(bulkAssignMailThreads, {
    onSuccess: ({ data }) => {
      toast.success(`Assigned ${data?.count ?? selectedList.length}`);
      clearSelection();
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not assign threads')
  });

  const { execute: runBulkTag } = useAction(bulkApplyMailThreadTag, {
    onSuccess: ({ data }) => {
      toast.success(`Tagged ${data?.count ?? selectedList.length}`);
      clearSelection();
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not tag threads')
  });

  const askDelete = React.useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      requestMailDelete(
        skipDeleteWarning,
        () => {
          setDeleteIds(ids);
          setDeleteOpen(true);
        },
        () => runBulkDelete({ threadIds: ids })
      );
    },
    [runBulkDelete, skipDeleteWarning]
  );

  const selectableTags = React.useMemo(() => {
    const selectedAliasIds = threads
      .filter((thread) => selectedIds.has(thread.id))
      .map((thread) => thread.aliasId);
    return tagsForAliasIds(tags, selectedAliasIds);
  }, [threads, selectedIds, tags]);

  const selectionApi: MailListSelectionApi = {
    selectedCount: selectedIds.size,
    allSelected,
    someSelected,
    toggleAll,
    clearSelection,
    askDeleteSelected: () => askDelete(selectedList),
    archiveSelected: () =>
      runBulkArchive({
        threadIds: selectedList,
        archive: !archivedView
      }),
    assignSelected: (assigneeId) =>
      runBulkAssign({ threadIds: selectedList, assigneeId }),
    tagSelected: (tagId) => runBulkTag({ threadIds: selectedList, tagId }),
    tags: selectableTags,
    members,
    archivedView
  };

  const listPanel = (
    <ul className="flex h-full min-h-0 flex-col overflow-y-auto border border-border bg-background md:border-0">
      {!selectionHeader ? (
        <li className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/60 bg-muted/20 px-4 py-2 sm:px-5">
          <Checkbox
            checked={
              allSelected ? true : someSelected ? 'indeterminate' : false
            }
            onCheckedChange={() => toggleAll()}
            aria-label="Select all conversations"
            data-no-pull
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select'}
          </span>
        </li>
      ) : null}
      {threads.map((thread) => {
        const override = localOverrides[thread.id];
        const displayThread =
          override == null
            ? thread
            : {
                ...thread,
                isUnread: override.isUnread ?? thread.isUnread,
                awaitingReply: override.awaitingReply ?? thread.awaitingReply,
                lastMessageAt: override.lastMessageAt ?? thread.lastMessageAt
              };

        return (
          <MailThreadRow
            key={thread.id}
            thread={displayThread}
            tags={tags}
            members={members}
            archivedView={archivedView}
            previewActive={activeThreadId === thread.id}
            selected={selectedIds.has(thread.id)}
            onToggleSelected={(checked) => toggleOne(thread.id, checked)}
            onSelect={() => selectThread(thread.id)}
            onAskDelete={() => askDelete([thread.id])}
          />
        );
      })}
    </ul>
  );

  const readingPane = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-border bg-background md:border-0 md:border-l">
      {paneLoading && !paneThread ? (
        <div className="flex h-full items-center justify-center gap-2.5 p-6 text-sm text-muted-foreground">
          <SkillzCubeLoader size={28} />
          Opening conversation…
        </div>
      ) : paneThread ? (
        <MailThreadDetail
          key={paneThread.id}
          thread={paneThread}
          tags={tags}
          members={members}
          embedded
          onClosed={clearPane}
        />
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
          Select a thread to open it
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {selectionHeader ? selectionHeader(selectionApi) : null}

      {selectedIds.size > 0 && !selectionHeader ? (
        <MailBulkActionBar selection={selectionApi} />
      ) : null}

      <div className="h-[min(72vh,calc(100vh-12rem))] min-h-[420px] overflow-hidden border border-border bg-background">
        <div className="hidden h-full md:block">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full"
          >
            <ResizablePanel
              defaultSize={38}
              minSize={24}
              maxSize={50}
            >
              {listPanel}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={62}
              minSize={40}
            >
              {readingPane}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <div className="h-full md:hidden">{listPanel}</div>
      </div>

      <DeleteMailThreadsDialog
        open={deleteOpen}
        count={deleteIds.length}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteIds([]);
        }}
        onConfirm={() => {
          setSkipDeleteWarning(readSkipDeleteWarning());
          runBulkDelete({ threadIds: deleteIds });
        }}
      />
    </div>
  );
}

function MailBulkActionBar({
  selection
}: {
  selection: MailListSelectionApi;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-2 py-1.5 sm:px-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {selection.selectedCount} selected
      </span>
      <div
        className="hidden h-4 w-px bg-border sm:block"
        aria-hidden
      />
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
  );
}

function MailThreadRow({
  thread,
  tags,
  members,
  archivedView,
  previewActive,
  selected,
  onToggleSelected,
  onSelect,
  onAskDelete
}: {
  thread: MailThreadListItem;
  tags: MailTagItem[];
  members: Array<{ id: string; name: string }>;
  archivedView: boolean;
  previewActive: boolean;
  selected: boolean;
  onToggleSelected: (checked: boolean) => void;
  onSelect: () => void;
  onAskDelete: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const circleColor = thread.tag?.color ?? DEFAULT_UNREAD;
  const domain = senderDomain(thread.fromAddress);
  const label = senderLabel(thread);
  const applicableTags = tagsForAlias(tags, thread.aliasId);
  // Replied threads are opened even if isUnread was left stale in the DB.
  const effectivelyUnread = thread.isUnread && thread.awaitingReply;
  const [localUnread, setLocalUnread] = React.useState(effectivelyUnread);

  React.useEffect(() => {
    setLocalUnread(thread.isUnread && thread.awaitingReply);
  }, [thread.isUnread, thread.awaitingReply]);

  const { execute: runArchive } = useAction(archiveMailThread, {
    onSuccess: () => {
      toast.success(archivedView ? 'Moved to inbox' : 'Archived');
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not archive')
  });

  const { execute: runAssign } = useAction(assignMailThread, {
    onSuccess: () => {
      toast.success('Assigned');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError || 'Could not assign')
  });

  const { execute: runTag } = useAction(applyMailThreadTag, {
    onSuccess: () => {
      toast.success('Tag updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError || 'Could not tag')
  });

  const { execute: markRead } = useAction(markMailThreadRead, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) => {
      setLocalUnread(true);
      toast.error(error.serverError || 'Could not update read state');
    }
  });

  const openThread = (): void => {
    // Desktop: keep selection in the reading pane. Mobile: full thread page.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches
    ) {
      onSelect();
      return;
    }
    router.push(inboxThreadRoute(thread.id));
  };

  return (
    <li
      className={cn(
        'message-item group relative border-b border-border last:border-b-0',
        MAIL_SPLIT_ROW_HEIGHT_CLASS,
        localUnread
          ? 'bg-sky-50/80 dark:bg-sky-950/25'
          : 'bg-[color-mix(in_srgb,var(--frame,#7b7b73)_10%,transparent)] dark:bg-[color-mix(in_srgb,var(--frame,#7b7b73)_16%,transparent)]',
        previewActive &&
          (localUnread
            ? 'bg-sky-100/90 dark:bg-sky-950/40'
            : 'bg-[color-mix(in_srgb,var(--frame,#7b7b73)_18%,transparent)] dark:bg-[color-mix(in_srgb,var(--frame,#7b7b73)_24%,transparent)]'),
        selected && 'bg-muted/50'
      )}
    >
      <div
        role="button"
        tabIndex={0}
        className="flex h-full cursor-pointer items-center gap-3 px-4 py-3.5 pr-[6.5rem] transition-colors hover:bg-muted/30 sm:px-5 sm:pr-28"
        onClick={openThread}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openThread();
          }
        }}
      >
        <div
          className="shrink-0"
          data-no-pull
          onClick={stopRowEvent}
          onPointerDown={stopRowEvent}
          onKeyDown={stopRowEvent}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(value) => onToggleSelected(value === true)}
            aria-label={`Select ${thread.subject}`}
          />
        </div>

        <Avatar className="size-9 shrink-0">
          {domain ? (
            <AvatarImage
              src={getLogoUrl(domain, 72, true)}
              alt=""
            />
          ) : null}
          <AvatarFallback className="text-[10px] font-medium">
            {getInitials(label)}
          </AvatarFallback>
        </Avatar>

        <ReadCircle
          unread={localUnread}
          color={circleColor}
        />

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'min-w-0 truncate pr-1 text-sm leading-5 tracking-tight',
              localUnread
                ? 'font-semibold text-foreground'
                : 'font-medium text-foreground/90'
            )}
          >
            {thread.subject}
            <span className="font-normal text-muted-foreground">
              {' '}
              · {label}
            </span>
            {thread.messageCount > 1 ? (
              <span
                className="ml-1.5 inline-flex min-h-4 min-w-4 -translate-y-px items-center justify-center rounded-none bg-[#070607] px-1 align-middle font-mono text-[9px] font-normal leading-none text-white dark:bg-white dark:text-[#070607]"
                title={`${thread.messageCount} emails`}
              >
                {thread.messageCount > 99 ? '99+' : thread.messageCount}
              </span>
            ) : null}
          </p>

          <p className="mt-0.5 min-w-0 truncate text-xs leading-4 text-muted-foreground">
            {thread.preview ?? 'No preview'}
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute right-3 top-1/2 z-20 flex h-7 -translate-y-1/2 items-center sm:right-4"
        data-no-pull
      >
        <time
          dateTime={thread.lastMessageAt}
          suppressHydrationWarning
          className="pointer-events-none font-mono text-[10px] text-muted-foreground transition-opacity group-hover:opacity-0 group-focus-within:opacity-0"
        >
          {formatDistanceToNow(new Date(thread.lastMessageAt), {
            addSuffix: true
          })}
        </time>

        <div
          className="pointer-events-auto absolute right-0 top-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          onClick={stopRowEvent}
          onPointerDown={stopRowEvent}
        >
          {localUnread ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 bg-background/95 shadow-sm"
              title="Mark as read"
              onClick={(event) => {
                stopRowEvent(event);
                setLocalUnread(false);
                markRead({ threadId: thread.id, isUnread: false });
              }}
            >
              <CheckIcon className="size-3.5 text-sky-600" />
              <span className="sr-only">Mark as read</span>
            </Button>
          ) : null}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 bg-background/95 shadow-sm"
                onClick={stopRowEvent}
                onPointerDown={stopRowEvent}
              >
                <MoreHorizontalIcon className="size-3.5" />
                <span className="sr-only">Thread actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              {archivedView ? (
                <DropdownMenuItem
                  onSelect={() =>
                    runArchive({
                      threadId: thread.id,
                      archive: false
                    })
                  }
                >
                  Move to inbox
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UserPlus2Icon className="mr-2 size-4" />
                  Assign
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onSelect={() =>
                      runAssign({
                        threadId: thread.id,
                        assigneeId: null
                      })
                    }
                  >
                    Unassigned
                  </DropdownMenuItem>
                  {members.map((member) => (
                    <DropdownMenuItem
                      key={member.id}
                      onSelect={() =>
                        runAssign({
                          threadId: thread.id,
                          assigneeId: member.id
                        })
                      }
                    >
                      {member.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {applicableTags.length > 0 ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Tag color</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onSelect={() =>
                        runTag({ threadId: thread.id, tagId: null })
                      }
                    >
                      No tag
                    </DropdownMenuItem>
                    {applicableTags.map((tag) => (
                      <DropdownMenuItem
                        key={tag.id}
                        onSelect={() =>
                          runTag({
                            threadId: thread.id,
                            tagId: tag.id
                          })
                        }
                      >
                        <span
                          className="mr-2 size-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={onAskDelete}
              >
                <Trash2Icon className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}
