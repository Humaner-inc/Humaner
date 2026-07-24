'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { suggestMailThreadReplies } from '@/actions/inbox/suggest-mail-replies';
import { useHumanerChatOptional } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import {
  DeleteMailThreadsDialog,
  readSkipDeleteWarning,
  requestMailDelete
} from '@/components/dashboard/inbox/delete-mail-threads-dialog';
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
import { SkillzCubeLoader } from '@/components/ui/skillz-cube-loader';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import type {
  MailTagItem,
  MailThreadListItem
} from '@/data/inbox/get-mail-threads';
import { getLogoUrl } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

const DEFAULT_UNREAD = '#3B82F6';

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
  color,
  count
}: {
  unread: boolean;
  color: string;
  count: number;
}): React.JSX.Element {
  return (
    <span className="mt-1.5 flex w-5 shrink-0 flex-col items-center gap-1">
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
      {count > 1 ? (
        <span
          className="inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#070607] px-1 font-mono text-[9px] leading-none text-white dark:bg-white dark:text-[#070607]"
          title={`${count} emails`}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </span>
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
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [skipDeleteWarning, setSkipDeleteWarning] = React.useState(false);

  React.useEffect(() => {
    setSkipDeleteWarning(readSkipDeleteWarning());
  }, []);

  React.useEffect(() => {
    const valid = new Set(threads.map((thread) => thread.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => valid.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [threads]);

  const hovered =
    threads.find((thread) => thread.id === hoveredId) ?? threads[0] ?? null;

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
    tags,
    members,
    archivedView
  };

  return (
    <div className="space-y-3">
      {selectionHeader ? selectionHeader(selectionApi) : null}

      {selectedIds.size > 0 && !selectionHeader ? (
        <MailBulkActionBar selection={selectionApi} />
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <ul className="min-w-0 self-start overflow-hidden border border-border bg-background">
          {!selectionHeader ? (
            <li className="flex items-center gap-3 border-b border-border/60 bg-muted/20 px-4 py-2 sm:px-5">
              <Checkbox
                checked={
                  allSelected ? true : someSelected ? 'indeterminate' : false
                }
                onCheckedChange={() => toggleAll()}
                aria-label="Select all conversations"
                data-no-pull
              />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : 'Select'}
              </span>
            </li>
          ) : null}
          {threads.map((thread) => (
            <MailThreadRow
              key={thread.id}
              thread={thread}
              tags={tags}
              members={members}
              archivedView={archivedView}
              previewActive={hovered?.id === thread.id}
              selected={selectedIds.has(thread.id)}
              onToggleSelected={(checked) => toggleOne(thread.id, checked)}
              onPreview={() => setHoveredId(thread.id)}
              onAskDelete={() => askDelete([thread.id])}
            />
          ))}
        </ul>

        <div className="hidden min-w-0 self-start lg:block">
          <MailHoverPreview
            key={hovered?.id ?? 'empty'}
            thread={hovered}
            archivedView={archivedView}
          />
        </div>
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

function MailHoverPreview({
  thread,
  archivedView
}: {
  thread: MailThreadListItem | null;
  archivedView: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const chat = useHumanerChatOptional();
  const threadId = thread?.id ?? null;
  const [localUnread, setLocalUnread] = React.useState(
    thread?.isUnread ?? false
  );
  const [suggestions, setSuggestions] = React.useState<
    Array<{ label: string; draft: string }>
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
  const [requested, setRequested] = React.useState(false);

  React.useEffect(() => {
    setLocalUnread(thread?.isUnread ?? false);
    setSuggestions([]);
    setLoadingSuggestions(false);
    setRequested(false);
  }, [thread?.id, thread?.isUnread]);

  const { execute: markRead, isExecuting } = useAction(markMailThreadRead, {
    onSuccess: ({ data, input }) => {
      if (input.threadId !== threadId) return;
      if (data?.success) {
        setLocalUnread(input.isUnread);
        router.refresh();
      }
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not update read state')
  });

  const { execute: loadSuggestions } = useAction(suggestMailThreadReplies, {
    onSuccess: ({ data, input }) => {
      if (input.threadId !== threadId) return;
      setSuggestions(data?.suggestions ?? []);
      setLoadingSuggestions(false);
    },
    onError: ({ input }) => {
      if (input.threadId !== threadId) return;
      setSuggestions([]);
      setLoadingSuggestions(false);
      toast.error('Could not load quick answers');
    }
  });

  if (!thread) {
    return (
      <div className="border border-border bg-muted/10 p-6 text-sm text-muted-foreground">
        Hover a thread to preview it and use quick answers.
      </div>
    );
  }

  const label = senderLabel(thread);

  const startQuickAnswers = (): void => {
    if (!threadId || archivedView || loadingSuggestions) return;
    setRequested(true);
    setLoadingSuggestions(true);
    setSuggestions([]);
    loadSuggestions({ threadId });
  };

  const runQuickAnswer = (suggestion: {
    label: string;
    draft: string;
  }): void => {
    if (!chat) {
      toast.error('Ask Humaner is unavailable right now');
      return;
    }
    chat.openChat();
    void chat.sendMessage(
      [
        `Polish this reply for the email about “${thread.subject}”. Keep the same intent.`,
        '',
        `Intent: ${suggestion.label}`,
        '',
        suggestion.draft
      ].join('\n')
    );
  };

  const showQuickAnswers = !archivedView;
  const showingLoader =
    requested && loadingSuggestions && suggestions.length === 0;
  const showingResults =
    requested && !loadingSuggestions && suggestions.length > 0;
  const showingEmpty =
    requested && !loadingSuggestions && suggestions.length === 0;

  return (
    <aside className="sticky top-0 flex w-full flex-col overflow-hidden border border-border bg-background">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{thread.subject}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            disabled={isExecuting || !localUnread}
            title={localUnread ? 'Mark as read' : 'Already read'}
            onClick={() => {
              setLocalUnread(false);
              markRead({ threadId: thread.id, isUnread: false });
            }}
          >
            <CheckIcon
              className={cn(
                'size-4',
                localUnread ? 'text-sky-600' : 'text-muted-foreground'
              )}
            />
            <span className="sr-only">Mark as read</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-none font-mono text-[10px]"
            asChild
          >
            <Link href={inboxThreadRoute(thread.id)}>Open</Link>
          </Button>
        </div>
      </div>

      <div className="max-h-40 overflow-y-auto px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        {thread.preview ?? 'No preview available for this thread.'}
      </div>

      {showQuickAnswers ? (
        <div className="space-y-2 border-t px-4 py-3">
          {!requested || showingLoader ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={showingLoader}
              onClick={startQuickAnswers}
              className={cn(
                'h-9 w-full justify-start gap-2.5 rounded-none px-4 font-mono',
                showingLoader && 'text-muted-foreground'
              )}
            >
              {showingLoader ? (
                <>
                  <SkillzCubeLoader size={24} />
                  Matching replies…
                </>
              ) : (
                'Quick answers'
              )}
            </Button>
          ) : null}

          {showingResults ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Quick answers
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${thread.id}-${suggestion.label}-${index}`}
                    type="button"
                    onClick={() => runQuickAnswer(suggestion)}
                    className="flex items-center gap-2 rounded-none px-2 py-2 text-left text-xs transition-colors hover:bg-[color-mix(in_srgb,var(--accent-color,#e1ccaf)_12%,transparent)]"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-none bg-muted font-mono text-[10px] text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0 truncate">{suggestion.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {showingEmpty ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">No suggestions</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-none font-mono text-[10px]"
                onClick={startQuickAnswers}
              >
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
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
  onPreview,
  onAskDelete
}: {
  thread: MailThreadListItem;
  tags: MailTagItem[];
  members: Array<{ id: string; name: string }>;
  archivedView: boolean;
  previewActive: boolean;
  selected: boolean;
  onToggleSelected: (checked: boolean) => void;
  onPreview: () => void;
  onAskDelete: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const circleColor = thread.tag?.color ?? DEFAULT_UNREAD;
  const domain = senderDomain(thread.fromAddress);
  const label = senderLabel(thread);
  const [localUnread, setLocalUnread] = React.useState(thread.isUnread);

  React.useEffect(() => {
    setLocalUnread(thread.isUnread);
  }, [thread.isUnread]);

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
    router.push(inboxThreadRoute(thread.id));
  };

  return (
    <li
      className={cn(
        'message-item group relative border-b border-border/60 last:border-b-0',
        localUnread && 'bg-sky-50/80 dark:bg-sky-950/25',
        previewActive && 'bg-muted/40',
        selected && 'bg-muted/50'
      )}
      onMouseEnter={onPreview}
      onFocusCapture={onPreview}
    >
      <div
        role="link"
        tabIndex={0}
        className="flex cursor-pointer gap-3 px-4 py-3.5 pr-[6.5rem] transition-colors hover:bg-muted/30 sm:px-5 sm:pr-28"
        onClick={openThread}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openThread();
          }
        }}
      >
        <div
          className="mt-2.5 shrink-0"
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

        <Avatar className="mt-0.5 size-9 shrink-0">
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
          count={thread.messageCount}
        />

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'min-w-0 truncate pr-1 text-sm tracking-tight',
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
          </p>

          <p className="mt-0.5 min-w-0 truncate text-xs text-muted-foreground">
            {thread.preview ?? 'No preview'}
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute right-3 top-3.5 z-20 flex h-7 items-center sm:right-4"
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
              {tags.length > 0 ? (
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
                    {tags.map((tag) => (
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
