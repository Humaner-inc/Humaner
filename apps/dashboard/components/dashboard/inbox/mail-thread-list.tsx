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
import { AssigneeMenuItems } from '@/components/dashboard/assignee-options';
import { useDashboardDockOptional } from '@/components/dashboard/dock/dashboard-dock-context';
import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import { ComposeMailPanel } from '@/components/dashboard/inbox/compose-mail-panel';
import {
  DeleteMailThreadsDialog,
  readSkipDeleteWarning,
  requestMailDelete
} from '@/components/dashboard/inbox/delete-mail-threads-dialog';
import { MailThreadDetail } from '@/components/dashboard/inbox/mail-thread-detail';
import type { AssigneePerson } from '@/components/ui/assignees';
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
import { COMPANION_ASSIGNEE } from '@/lib/inbox/mail-assignee-shared';
import { tagsForAlias, tagsForAliasIds } from '@/lib/inbox/mail-tag-scope';
import {
  OPEN_THREAD_NOTES_EVENT,
  readOpenThreadNotesDetail
} from '@/lib/inbox/open-thread-notes';
import { getLogoUrl } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

const DEFAULT_UNREAD = '#0b00d1';
const INBOX_BULK_DELETE_BUTTON_CLASS =
  'h-8 font-mono text-[10px] hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive';
const ROW_SELECT_LONG_PRESS_MS = 450;

function ReadCircle({
  unread,
  color
}: {
  unread: boolean;
  color: string;
}): React.JSX.Element {
  return (
    <span
      className="mt-2 size-2.5 shrink-0 rounded-full"
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

export type MailListSelectionApi = {
  selectMode: boolean;
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  enterSelectMode: () => void;
  toggleAll: () => void;
  clearSelection: () => void;
  askDeleteSelected: () => void;
  archiveSelected: () => void;
  assignSelected: (assigneeId: string | null) => void;
  tagSelected: (tagId: string | null) => void;
  tags: MailTagItem[];
  members: AssigneePerson[];
  archivedView: boolean;
};

export function MailThreadList({
  threads,
  tags = [],
  members = [],
  archivedView = false,
  selectionHeader,
  listChrome,
  variant = 'card'
}: {
  threads: MailThreadListItem[];
  tags?: MailTagItem[];
  members?: AssigneePerson[];
  archivedView?: boolean;
  selectionHeader?: (selection: MailListSelectionApi) => React.ReactNode;
  /** Extra chrome above the thread rows (title, filters) — desk triage sidebar. */
  listChrome?: React.ReactNode;
  /** `desk` = Human Desk full-bleed list/detail split. */
  variant?: 'card' | 'desk';
}): React.JSX.Element {
  const router = useRouter();
  const isDesk = variant === 'desk';
  const dock = useDashboardDockOptional();
  const { composeOpen, composeInPanel, closeCompose } = useComposeMail();
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    null
  );
  const activeThreadIdRef = React.useRef<string | null>(null);
  const [paneThread, setPaneThread] =
    React.useState<MailThreadDetailDto | null>(null);
  const [paneLoading, setPaneLoading] = React.useState(false);
  const detailCacheRef = React.useRef(new Map<string, MailThreadDetailDto>());
  const prefetchingRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  const showComposePanel = composeOpen && composeInPanel && isDesk;
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [selectMode, setSelectMode] = React.useState(false);
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [skipDeleteWarning, setSkipDeleteWarning] = React.useState(false);
  type ThreadOverride = {
    removed?: boolean;
    isUnread?: boolean;
    awaitingReply?: boolean;
    lastMessageAt?: string;
    tag?: MailTagItem | null;
    assigneeName?: string | null;
  };

  /** Optimistic patches until the server list refresh lands. */
  const [localOverrides, setLocalOverrides] = React.useState<
    Record<string, ThreadOverride>
  >({});

  const [splitReady, setSplitReady] = React.useState(false);
  React.useEffect(() => {
    setSplitReady(true);
  }, []);

  const patchThreads = React.useCallback(
    (ids: string[], patch: ThreadOverride) => {
      setLocalOverrides((current) => {
        const next = { ...current };
        for (const id of ids) {
          next[id] = { ...next[id], ...patch };
        }
        return next;
      });
    },
    []
  );

  const restoreThreads = React.useCallback((ids: string[]) => {
    setLocalOverrides((current) => {
      const next = { ...current };
      for (const id of ids) {
        if (!next[id]) continue;
        const rest = { ...next[id] };
        delete rest.removed;
        if (Object.keys(rest).length === 0) delete next[id];
        else next[id] = rest;
      }
      return next;
    });
  }, []);

  const markThreadOpened = React.useCallback((threadId: string) => {
    setLocalOverrides((current) => ({
      ...current,
      [threadId]: {
        ...current[threadId],
        isUnread: false
      }
    }));
  }, []);

  const clearPane = React.useCallback(() => {
    activeThreadIdRef.current = null;
    setActiveThreadId(null);
    setPaneThread(null);
    setPaneLoading(false);
  }, []);

  const removeThreads = React.useCallback(
    (ids: string[]) => {
      patchThreads(ids, { removed: true });
      if (
        activeThreadIdRef.current &&
        ids.includes(activeThreadIdRef.current)
      ) {
        clearPane();
      }
      setSelectedIds((current) => {
        if (ids.every((id) => !current.has(id))) return current;
        const next = new Set(current);
        for (const id of ids) next.delete(id);
        return next;
      });
    },
    [clearPane, patchThreads]
  );

  const applyThreadDetail = React.useCallback(
    (threadId: string, data: MailThreadDetailDto) => {
      detailCacheRef.current.set(threadId, data);
      if (threadId !== activeThreadIdRef.current || data.id !== threadId) {
        return;
      }
      setPaneThread(data);
      setPaneLoading(false);
      markThreadOpened(threadId);
    },
    [markThreadOpened]
  );

  const requestThread = React.useCallback(
    (threadId: string) => {
      prefetchingRef.current.add(threadId);
      void fetchMailThread({ threadId })
        .then((result) => {
          prefetchingRef.current.delete(threadId);
          if (!result?.data) {
            if (threadId === activeThreadIdRef.current) {
              setPaneLoading(false);
              setPaneThread(null);
              toast.error('Could not open thread');
            }
            return;
          }
          applyThreadDetail(threadId, result.data);
        })
        .catch(() => {
          prefetchingRef.current.delete(threadId);
          if (threadId !== activeThreadIdRef.current) return;
          setPaneLoading(false);
          setPaneThread(null);
          toast.error('Could not open thread');
        });
    },
    [applyThreadDetail]
  );

  const prefetchThread = React.useCallback(
    (threadId: string) => {
      if (detailCacheRef.current.has(threadId)) return;
      if (prefetchingRef.current.has(threadId)) return;
      requestThread(threadId);
    },
    [requestThread]
  );

  const { execute: runRowMarkRead } = useAction(markMailThreadRead, {
    onSuccess: () => router.refresh(),
    onError: ({ error, input }) => {
      patchThreads([input.threadId], { isUnread: true });
      toast.error(error.serverError || 'Could not update read state');
    }
  });

  const selectThread = React.useCallback(
    (threadId: string) => {
      closeCompose();
      activeThreadIdRef.current = threadId;
      setActiveThreadId(threadId);
      const listThread = threads.find((thread) => thread.id === threadId);
      const isUnread =
        localOverrides[threadId]?.isUnread ?? listThread?.isUnread;
      if (isUnread) {
        markThreadOpened(threadId);
        runRowMarkRead({ threadId, isUnread: false });
      }
      const cached = detailCacheRef.current.get(threadId);
      if (dock?.activeMode === 'team' && dock.teamTab === 'notes') {
        const listThread = threads.find((thread) => thread.id === threadId);
        dock.setNotesFocus({
          threadId,
          subject: cached?.subject ?? listThread?.subject ?? null,
          sharedNoteDraft: cached?.sharedNoteDraft ?? null
        });
      }
      if (cached) {
        setPaneThread(cached);
        setPaneLoading(false);
        return;
      }
      setPaneThread(null);
      setPaneLoading(true);
      if (prefetchingRef.current.has(threadId)) return;
      requestThread(threadId);
    },
    [
      closeCompose,
      dock,
      localOverrides,
      markThreadOpened,
      requestThread,
      runRowMarkRead,
      threads
    ]
  );

  React.useEffect(() => {
    function onOpenNotes(event: Event): void {
      const threadId = readOpenThreadNotesDetail(event);
      if (!threadId) return;
      selectThread(threadId);
    }
    window.addEventListener(OPEN_THREAD_NOTES_EVENT, onOpenNotes);
    return () =>
      window.removeEventListener(OPEN_THREAD_NOTES_EVENT, onOpenNotes);
  }, [selectThread]);

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

  const displayThreads = React.useMemo(() => {
    return threads
      .filter((thread) => !localOverrides[thread.id]?.removed)
      .map((thread) => {
        const override = localOverrides[thread.id];
        if (!override) return thread;
        return {
          ...thread,
          isUnread: override.isUnread ?? thread.isUnread,
          awaitingReply: override.awaitingReply ?? thread.awaitingReply,
          lastMessageAt: override.lastMessageAt ?? thread.lastMessageAt,
          tag: override.tag === undefined ? thread.tag : override.tag,
          assigneeName:
            override.assigneeName === undefined
              ? thread.assigneeName
              : override.assigneeName
        };
      });
  }, [threads, localOverrides]);

  React.useEffect(() => {
    setLocalOverrides((current) => {
      let changed = false;
      const next = { ...current };
      const byId = new Map(threads.map((thread) => [thread.id, thread]));

      for (const id of Object.keys(next)) {
        const override = next[id];
        const thread = byId.get(id);

        if (override.removed) {
          // Keep until the server list confirms the thread is gone.
          if (!thread) {
            delete next[id];
            changed = true;
          }
          continue;
        }

        if (!thread) {
          delete next[id];
          changed = true;
          continue;
        }

        const unreadCaughtUp =
          override.isUnread === undefined ||
          thread.isUnread === override.isUnread;
        const timeCaughtUp =
          !override.lastMessageAt ||
          new Date(thread.lastMessageAt).getTime() >=
            new Date(override.lastMessageAt).getTime() - 2000;
        const tagCaughtUp =
          override.tag === undefined ||
          (override.tag?.id ?? null) === (thread.tag?.id ?? null);
        const assigneeCaughtUp =
          override.assigneeName === undefined ||
          (thread.assigneeName ?? null) === (override.assigneeName ?? null);

        if (unreadCaughtUp && timeCaughtUp && tagCaughtUp && assigneeCaughtUp) {
          delete next[id];
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
      requestThread(activeThreadId);
    }
  }, [threads, activeThreadId, requestThread]);

  const allSelected =
    displayThreads.length > 0 && selectedIds.size === displayThreads.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < displayThreads.length;
  const selectedList = React.useMemo(() => [...selectedIds], [selectedIds]);

  const toggleOne = React.useCallback((threadId: string, checked: boolean) => {
    setSelectMode(true);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(threadId);
      else next.delete(threadId);
      return next;
    });
  }, []);

  const enterSelectMode = React.useCallback(() => {
    setSelectMode(true);
  }, []);

  const toggleAll = React.useCallback(() => {
    setSelectMode(true);
    setSelectedIds((current) => {
      if (displayThreads.length > 0 && current.size === displayThreads.length) {
        return new Set();
      }
      return new Set(displayThreads.map((thread) => thread.id));
    });
  }, [displayThreads]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

  const refreshInBackground = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const { execute: runBulkArchive } = useAction(bulkArchiveMailThreads, {
    onSuccess: () => {
      clearSelection();
      refreshInBackground();
    },
    onError: ({ error, input }) => {
      restoreThreads(input.threadIds);
      toast.error(error.serverError || 'Could not update threads');
    }
  });

  const { execute: runBulkDelete } = useAction(bulkDeleteMailThreads, {
    onSuccess: ({ data }) => {
      clearSelection();
      setDeleteOpen(false);
      setDeleteIds([]);
      toast.success(`Deleted ${data?.count ?? 0}`);
      refreshInBackground();
    },
    onError: ({ error, input }) => {
      restoreThreads(input.threadIds);
      toast.error(error.serverError || 'Could not delete threads');
    }
  });

  const { execute: runBulkAssign } = useAction(bulkAssignMailThreads, {
    onSuccess: () => {
      clearSelection();
      refreshInBackground();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not assign threads')
  });

  const { execute: runBulkTag } = useAction(bulkApplyMailThreadTag, {
    onSuccess: () => {
      clearSelection();
      refreshInBackground();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not tag threads')
  });

  const { execute: runRowArchive } = useAction(archiveMailThread, {
    onSuccess: () => refreshInBackground(),
    onError: ({ error, input }) => {
      restoreThreads([input.threadId]);
      toast.error(error.serverError || 'Could not archive');
    }
  });

  const { execute: runRowAssign } = useAction(assignMailThread, {
    onSuccess: () => refreshInBackground(),
    onError: ({ error }) => toast.error(error.serverError || 'Could not assign')
  });

  const { execute: runRowTag } = useAction(applyMailThreadTag, {
    onSuccess: () => refreshInBackground(),
    onError: ({ error }) => toast.error(error.serverError || 'Could not tag')
  });

  const askDelete = React.useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const commit = (): void => {
        removeThreads(ids);
        runBulkDelete({ threadIds: ids });
      };
      requestMailDelete(
        skipDeleteWarning,
        () => {
          setDeleteIds(ids);
          setDeleteOpen(true);
        },
        commit
      );
    },
    [removeThreads, runBulkDelete, skipDeleteWarning]
  );

  const selectableTags = React.useMemo(() => {
    const selectedAliasIds = displayThreads
      .filter((thread) => selectedIds.has(thread.id))
      .map((thread) => thread.aliasId);
    return tagsForAliasIds(tags, selectedAliasIds);
  }, [displayThreads, selectedIds, tags]);

  const selectionApi: MailListSelectionApi = {
    selectMode,
    selectedCount: selectedIds.size,
    allSelected,
    someSelected,
    enterSelectMode,
    toggleAll,
    clearSelection,
    askDeleteSelected: () => askDelete(selectedList),
    archiveSelected: () => {
      const ids = selectedList;
      removeThreads(ids);
      toast.success(
        archivedView ? `Moved ${ids.length} to inbox` : `Archived ${ids.length}`
      );
      runBulkArchive({
        threadIds: ids,
        archive: !archivedView
      });
    },
    assignSelected: (assigneeId) => {
      const memberName =
        assigneeId === COMPANION_ASSIGNEE
          ? 'Companion'
          : assigneeId == null
            ? null
            : (members.find((member) => member.id === assigneeId)?.name ??
              null);
      patchThreads(selectedList, { assigneeName: memberName });
      toast.success(`Assigned ${selectedList.length}`);
      runBulkAssign({ threadIds: selectedList, assigneeId });
    },
    tagSelected: (tagId) => {
      const tag =
        tagId == null ? null : (tags.find((item) => item.id === tagId) ?? null);
      patchThreads(selectedList, { tag });
      toast.success(`Tagged ${selectedList.length}`);
      runBulkTag({ threadIds: selectedList, tagId });
    },
    tags: selectableTags,
    members,
    archivedView
  };

  const selectionActive = selectMode || selectedIds.size > 0;

  const threadRows = displayThreads.map((thread, index) => {
    return (
      <MailThreadRow
        key={thread.id}
        thread={thread}
        tags={tags}
        members={members}
        archivedView={archivedView}
        previewActive={activeThreadId === thread.id}
        showCheckboxes={selectionActive}
        selected={selectedIds.has(thread.id)}
        avatarEager={index < 12}
        onToggleSelected={(checked) => toggleOne(thread.id, checked)}
        onSelect={() => selectThread(thread.id)}
        onPrefetch={() => prefetchThread(thread.id)}
        onAskDelete={() => askDelete([thread.id])}
        onArchive={(archive) => {
          removeThreads([thread.id]);
          toast.success(archive ? 'Archived' : 'Moved to inbox');
          runRowArchive({ threadId: thread.id, archive });
        }}
        onAssign={(assigneeId) => {
          const memberName =
            assigneeId === COMPANION_ASSIGNEE
              ? 'Companion'
              : assigneeId == null
                ? null
                : (members.find((member) => member.id === assigneeId)?.name ??
                  null);
          patchThreads([thread.id], { assigneeName: memberName });
          toast.success('Assigned');
          runRowAssign({ threadId: thread.id, assigneeId });
        }}
        onTag={(tagId) => {
          const tag =
            tagId == null
              ? null
              : (tags.find((item) => item.id === tagId) ?? null);
          patchThreads([thread.id], { tag });
          toast.success('Tag updated');
          runRowTag({ threadId: thread.id, tagId });
        }}
        onMarkRead={() => {
          patchThreads([thread.id], { isUnread: false });
          runRowMarkRead({ threadId: thread.id, isUnread: false });
        }}
      />
    );
  });

  const listPanel = isDesk ? (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {listChrome ? (
        <div className="shrink-0 border-b border-border/50">{listChrome}</div>
      ) : null}
      {selectionHeader ? (
        <div className="shrink-0 border-b border-border/50">
          {selectionHeader(selectionApi)}
        </div>
      ) : null}
      {selectionActive && !selectionHeader ? (
        <div className="shrink-0 border-b border-border/50 px-3 py-2">
          <MailBulkActionBar selection={selectionApi} />
        </div>
      ) : null}
      <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {!selectionHeader && selectionActive ? (
          <li className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/60 bg-background px-4 py-2 sm:px-5">
            <Checkbox
              checked={
                allSelected ? true : someSelected ? 'indeterminate' : false
              }
              onCheckedChange={() => toggleAll()}
              aria-label="Select all conversations"
              data-no-pull
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {selectedIds.size} selected
            </span>
          </li>
        ) : null}
        {threadRows.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nothing in this inbox yet.
          </li>
        ) : (
          threadRows
        )}
      </ul>
    </div>
  ) : (
    <ul className="flex h-full min-h-0 flex-col overflow-y-auto border border-border bg-background md:border-0">
      {!selectionHeader && selectionActive ? (
        <li className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/60 bg-background px-4 py-2 sm:px-5">
          <Checkbox
            checked={
              allSelected ? true : someSelected ? 'indeterminate' : false
            }
            onCheckedChange={() => toggleAll()}
            aria-label="Select all conversations"
            data-no-pull
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {selectedIds.size} selected
          </span>
        </li>
      ) : null}
      {threadRows.length === 0 ? (
        <li className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nothing in this inbox yet.
        </li>
      ) : (
        threadRows
      )}
    </ul>
  );

  const paneMatches =
    paneThread != null &&
    activeThreadId != null &&
    paneThread.id === activeThreadId;

  const readingPane = showComposePanel ? (
    <ComposeMailPanel />
  ) : (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden bg-background',
        !isDesk && 'border border-border md:border-0 md:border-l'
      )}
    >
      {paneMatches ? (
        <MailThreadDetail
          key={paneThread.id}
          thread={paneThread}
          tags={tags}
          members={members}
          embedded
          onClosed={clearPane}
          onRemoved={() => {
            removeThreads([paneThread.id]);
          }}
          onPatched={(patch) => {
            patchThreads([paneThread.id], patch);
            setPaneThread((current) =>
              current && current.id === activeThreadIdRef.current
                ? {
                    ...current,
                    ...(patch.tag !== undefined ? { tag: patch.tag } : {}),
                    ...(patch.isUnread !== undefined
                      ? { isUnread: patch.isUnread }
                      : {})
                  }
                : current
            );
          }}
        />
      ) : paneLoading || activeThreadId ? (
        <div className="flex h-full items-center justify-center gap-2.5 p-6 text-sm text-muted-foreground">
          <SkillzCubeLoader />
          Opening conversation…
        </div>
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
          Select a thread to open it
        </div>
      )}
    </div>
  );

  const deskSplitFallback = (
    <div className="flex size-full min-h-0 overflow-hidden">
      <div className="h-full min-h-0 w-[42%] min-w-[16rem] max-w-[50%] shrink-0 overflow-hidden border-r border-border/50">
        {listPanel}
      </div>
      <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
        {readingPane}
      </div>
    </div>
  );

  const cardSplitFallback = (
    <div className="flex size-full min-h-0">
      <div className="h-full w-[38%] min-w-[24%] max-w-[50%] shrink-0">
        {listPanel}
      </div>
      <div className="h-full min-h-0 min-w-0 flex-1">{readingPane}</div>
    </div>
  );

  const split = isDesk ? (
    <>
      <div className="hidden h-full min-h-0 w-full overflow-hidden md:block">
        {splitReady ? (
          <ResizablePanelGroup
            id="inbox-desk-split"
            direction="horizontal"
            className="h-full"
          >
            <ResizablePanel
              id="inbox-desk-list"
              defaultSize={42}
              minSize={28}
              maxSize={50}
              className="min-h-0 overflow-hidden"
            >
              <div className="h-full min-h-0 overflow-hidden border-r border-border/50">
                {listPanel}
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-px bg-border/50 transition-colors hover:bg-border" />
            <ResizablePanel
              id="inbox-desk-reading"
              defaultSize={58}
              className="min-h-0 overflow-hidden"
            >
              <div className="h-full min-h-0 overflow-hidden bg-background">
                {readingPane}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          deskSplitFallback
        )}
      </div>
      <div className="h-full min-h-0 w-full overflow-hidden md:hidden">
        {showComposePanel || paneMatches ? (
          <div className="h-full min-h-0 overflow-hidden bg-background">
            {readingPane}
          </div>
        ) : (
          <div className="h-full min-h-0 overflow-hidden border-r border-border/50">
            {listPanel}
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="h-[min(72vh,calc(100vh-12rem))] min-h-[420px] overflow-hidden border border-border bg-background">
      <div className="hidden h-full md:block">
        {splitReady ? (
          <ResizablePanelGroup
            id="inbox-card-split"
            direction="horizontal"
            className="h-full"
          >
            <ResizablePanel
              id="inbox-card-list"
              defaultSize={38}
              minSize={24}
              maxSize={50}
            >
              {listPanel}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="inbox-card-reading"
              defaultSize={62}
              minSize={40}
            >
              {readingPane}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          cardSplitFallback
        )}
      </div>
      <div className="h-full md:hidden">{listPanel}</div>
    </div>
  );

  const deleteDialog = (
    <DeleteMailThreadsDialog
      open={deleteOpen}
      count={deleteIds.length}
      onOpenChange={(open) => {
        setDeleteOpen(open);
        if (!open) setDeleteIds([]);
      }}
      onConfirm={() => {
        setSkipDeleteWarning(readSkipDeleteWarning());
        const ids = deleteIds;
        setDeleteOpen(false);
        setDeleteIds([]);
        removeThreads(ids);
        runBulkDelete({ threadIds: ids });
      }}
    />
  );

  if (isDesk) {
    return (
      <>
        <div className="flex h-full min-h-0 overflow-hidden">{split}</div>
        {deleteDialog}
      </>
    );
  }

  return (
    <div className="space-y-3">
      {selectionHeader ? selectionHeader(selectionApi) : null}

      {selectionActive && !selectionHeader ? (
        <MailBulkActionBar selection={selectionApi} />
      ) : null}

      {split}
      {deleteDialog}
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
              className="h-8 font-mono text-[10px]"
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
            className="h-8 font-mono text-[10px]"
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
            onSelect={(assigneeId) => selection.assignSelected(assigneeId)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 font-mono text-[10px]"
        onClick={selection.archiveSelected}
      >
        {selection.archivedView ? 'Move to inbox' : 'Archive'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={INBOX_BULK_DELETE_BUTTON_CLASS}
        onClick={selection.askDeleteSelected}
      >
        Delete
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
  showCheckboxes,
  selected,
  avatarEager,
  onToggleSelected,
  onSelect,
  onPrefetch,
  onAskDelete,
  onArchive,
  onAssign,
  onTag,
  onMarkRead
}: {
  thread: MailThreadListItem;
  tags: MailTagItem[];
  members: AssigneePerson[];
  archivedView: boolean;
  previewActive: boolean;
  showCheckboxes: boolean;
  selected: boolean;
  avatarEager: boolean;
  onToggleSelected: (checked: boolean) => void;
  onSelect: () => void;
  onPrefetch: () => void;
  onAskDelete: () => void;
  onArchive: (archive: boolean) => void;
  onAssign: (assigneeId: string | null) => void;
  onTag: (tagId: string | null) => void;
  onMarkRead: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const longPressTimerRef = React.useRef<number | null>(null);
  const longPressTriggeredRef = React.useRef(false);
  const circleColor = thread.tag?.color ?? DEFAULT_UNREAD;
  const domain = senderDomain(thread.fromAddress);
  const label = senderLabel(thread);
  const applicableTags = tagsForAlias(tags, thread.aliasId);
  // Replied threads are opened even if isUnread was left stale in the DB.
  const localUnread = thread.isUnread && thread.awaitingReply;

  const cancelLongPress = React.useCallback((): void => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => () => cancelLongPress(), [cancelLongPress]);

  const openThread = (): void => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

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

  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!showCheckboxes && (event.metaKey || event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      onToggleSelected(!selected);
      return;
    }

    openThread();
  };

  return (
    <li
      className={cn(
        'message-item group relative border-b border-border last:border-b-0 [content-visibility:auto] [contain-intrinsic-size:auto_5.25rem]',
        localUnread && 'bg-[color-mix(in_srgb,#0b00d1_8%,transparent)]',
        previewActive &&
          (localUnread
            ? 'bg-[color-mix(in_srgb,#0b00d1_14%,transparent)]'
            : 'bg-foreground/[0.06]'),
        selected && !localUnread && 'bg-foreground/[0.04]'
      )}
    >
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-start gap-3 px-3 py-3 pr-16 text-left transition-colors hover:bg-foreground/[0.04] sm:px-3"
        onClick={handleRowClick}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        onPointerDown={(event) => {
          if (showCheckboxes || event.button !== 0) return;
          cancelLongPress();
          longPressTimerRef.current = window.setTimeout(() => {
            longPressTimerRef.current = null;
            longPressTriggeredRef.current = true;
            onToggleSelected(true);
          }, ROW_SELECT_LONG_PRESS_MS);
        }}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openThread();
          }
        }}
      >
        {showCheckboxes ? (
          <div
            className="mt-1.5 shrink-0"
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
        ) : null}

        <Avatar className="mt-0.5 size-7 shrink-0 rounded-md">
          {domain ? (
            <AvatarImage
              src={getLogoUrl(domain, 64, true)}
              alt=""
              loading={avatarEager ? 'eager' : 'lazy'}
              decoding="async"
            />
          ) : null}
          <AvatarFallback className="rounded-md text-[10px] font-medium">
            {getInitials(label)}
          </AvatarFallback>
        </Avatar>

        <ReadCircle
          unread={localUnread}
          color={circleColor}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'min-w-0 truncate text-[13px] leading-5',
                localUnread
                  ? 'font-semibold text-foreground'
                  : 'text-foreground'
              )}
            >
              {label}
            </p>
            <time
              dateTime={thread.lastMessageAt}
              suppressHydrationWarning
              className="shrink-0 font-mono text-[10px] text-muted-foreground transition-opacity group-hover:opacity-0 group-focus-within:opacity-0"
            >
              {formatDistanceToNow(new Date(thread.lastMessageAt), {
                addSuffix: true
              })}
            </time>
          </div>
          <p
            className={cn(
              'mt-0.5 min-w-0 truncate text-[12px] leading-4',
              localUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {thread.subject || '(no subject)'}
            {thread.messageCount > 1 ? (
              <span
                className="ml-1.5 inline-flex min-h-4 min-w-4 -translate-y-px items-center justify-center rounded-md bg-[#0A0D0D] px-1 align-middle font-mono text-[9px] font-normal leading-none text-white dark:bg-white dark:text-[#0A0D0D]"
                title={`${thread.messageCount} emails`}
              >
                {thread.messageCount > 99 ? '99+' : thread.messageCount}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 min-w-0 truncate text-[11px] leading-4 text-muted-foreground">
            {thread.preview ?? 'No preview'}
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute right-3 top-3 z-20 flex h-7 items-center sm:right-3"
        data-no-pull
      >
        <div
          className="pointer-events-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          onClick={stopRowEvent}
          onPointerDown={stopRowEvent}
        >
          {localUnread ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg bg-background/95 shadow-sm"
              title="Mark as read"
              onClick={(event) => {
                stopRowEvent(event);
                onMarkRead();
              }}
            >
              <CheckIcon className="size-3.5 text-[#0b00d1]" />
              <span className="sr-only">Mark as read</span>
            </Button>
          ) : null}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg bg-background/95 shadow-sm"
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
                <DropdownMenuItem onSelect={() => onArchive(false)}>
                  Move to inbox
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onArchive(true)}>
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UserPlus2Icon className="mr-2 size-4" />
                  Assign
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <AssigneeMenuItems
                    members={members}
                    value={null}
                    includeCompanion
                    onSelect={onAssign}
                  />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {applicableTags.length > 0 ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Tag color</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onSelect={() => onTag(null)}>
                      No tag
                    </DropdownMenuItem>
                    {applicableTags.map((tag) => (
                      <DropdownMenuItem
                        key={tag.id}
                        onSelect={() => onTag(tag.id)}
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
