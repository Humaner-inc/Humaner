'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CheckIcon,
  MoreHorizontalIcon,
  PinIcon,
  Trash2Icon,
  UserPlus2Icon
} from '@humaner/shared/icons';
import { formatDistanceToNow } from 'date-fns';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { addContact } from '@/actions/contacts/manage-contacts';
import { blockMailSender } from '@/actions/inbox/manage-blocked-senders';
import {
  applyMailThreadTag,
  archiveMailThread,
  assignMailThread,
  bulkApplyMailThreadTag,
  bulkArchiveMailThreads,
  bulkAssignMailThreads,
  bulkDeleteMailThreads,
  bulkMoveMailThreads,
  markMailThreadRead,
  moveMailThreadFolder,
  pinMailThread
} from '@/actions/inbox/manage-mail-thread';
import { AssigneeMenuItems } from '@/components/dashboard/assignee-options';
import { useDashboardDockOptional } from '@/components/dashboard/dock/dashboard-dock-context';
import { BlockMailSenderDialog } from '@/components/dashboard/inbox/block-mail-sender-dialog';
import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import { ComposeMailPanel } from '@/components/dashboard/inbox/compose-mail-panel';
import {
  DeleteMailThreadsDialog,
  readSkipDeleteWarning,
  requestMailDelete
} from '@/components/dashboard/inbox/delete-mail-threads-dialog';
import { MailThreadAttachmentsControl } from '@/components/dashboard/inbox/mail-attachments-control';
import { MailThreadDetail } from '@/components/dashboard/inbox/mail-thread-detail';
import { MailThreadRowSwipe } from '@/components/dashboard/inbox/mail-thread-row-swipe';
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
import type {
  MailTagItem,
  MailThreadDetail as MailThreadDetailDto,
  MailThreadListItem
} from '@/data/inbox/get-mail-threads';
import { companyDomainFromEmail } from '@/lib/contacts/contact-email';
import { toastMailDeleted } from '@/lib/inbox/delete-toast';
import { COMPANION_ASSIGNEE } from '@/lib/inbox/mail-assignee-shared';
import { tagsForAlias, tagsForAliasIds } from '@/lib/inbox/mail-tag-scope';
import type { MailListFolder } from '@/lib/inbox/mail-thread-folder-shared';
import {
  OPEN_THREAD_NOTES_EVENT,
  readOpenThreadNotesDetail
} from '@/lib/inbox/open-thread-notes';
import { getLogoUrl } from '@/lib/logo';
import { playUiFeedbackSound } from '@/lib/sounds/ui-feedback-sound';
import { cn, getInitials } from '@/lib/utils';

const INBOX_BULK_DELETE_BUTTON_CLASS =
  'h-8 font-mono text-[10px] hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive';
const ROW_SELECT_LONG_PRESS_MS = 450;

function senderDomain(email: string | null): string | null {
  if (!email) return null;
  return companyDomainFromEmail(email);
}

function senderLabel(thread: MailThreadListItem): string {
  return thread.fromName || thread.fromAddress || thread.aliasAddress;
}

function stopRowEvent(event: React.SyntheticEvent): void {
  event.stopPropagation();
}

function OpeningThreadPane({
  thread
}: {
  thread: MailThreadListItem;
}): React.JSX.Element {
  const domain = senderDomain(thread.fromAddress);
  const label = senderLabel(thread);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-5 py-4">
        <Avatar className="size-9 shrink-0 rounded-md">
          {domain ? (
            <AvatarImage
              src={getLogoUrl(domain, 64)}
              alt=""
              loading="eager"
              decoding="async"
            />
          ) : null}
          <AvatarFallback className="rounded-md text-[11px] font-medium">
            {getInitials(label)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 truncate font-display text-lg font-normal tracking-tight">
            {thread.subject || '(no subject)'}
          </h1>
          <p className="mt-0.5 truncate font-info text-xs text-muted-foreground">
            {label}
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/80">
          {thread.preview || 'Opening conversation…'}
        </p>
      </div>
    </div>
  );
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
  spamSelected: () => void;
  restoreSelected: () => void;
  assignSelected: (assigneeId: string | null) => void;
  tagSelected: (tagId: string | null) => void;
  tags: MailTagItem[];
  members: AssigneePerson[];
  folderView: MailListFolder;
};

export function MailThreadList({
  threads,
  tags = [],
  members = [],
  archivedView = false,
  folderView = 'inbox',
  selectionHeader,
  listChrome,
  variant = 'card'
}: {
  threads: MailThreadListItem[];
  tags?: MailTagItem[];
  members?: AssigneePerson[];
  archivedView?: boolean;
  folderView?: MailListFolder;
  selectionHeader?: (selection: MailListSelectionApi) => React.ReactNode;
  /** Extra chrome above the thread rows (title, filters) — desk triage sidebar. */
  listChrome?: React.ReactNode;
  /** `desk` = Human Desk full-bleed list/detail split. */
  variant?: 'card' | 'desk';
}): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const threadFromUrl = searchParams.get('thread');
  const isDesk = variant === 'desk';
  const view: MailListFolder =
    folderView ?? (archivedView ? 'archive' : 'inbox');
  const inTrash = view === 'trash';
  const inSpam = view === 'spam';
  const inArchive = view === 'archive';
  const inDrafts = view === 'drafts';
  const dock = useDashboardDockOptional();
  const { composeOpen, composeInPanel, closeCompose } = useComposeMail();
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    null
  );
  const [addedContacts, setAddedContacts] = React.useState<
    Record<string, { id: string; image: string | null }>
  >({});
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
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [blockThreadId, setBlockThreadId] = React.useState<string | null>(null);
  type ThreadOverride = {
    removed?: boolean;
    isUnread?: boolean;
    isPinned?: boolean;
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

  const syncThreadInUrl = React.useCallback(
    (threadId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get('thread');
      if (threadId) {
        if (current === threadId) return;
        params.set('thread', threadId);
      } else if (!current) {
        return;
      } else {
        params.delete('thread');
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      });
    },
    [pathname, router, searchParams]
  );

  const clearPane = React.useCallback(() => {
    activeThreadIdRef.current = null;
    setActiveThreadId(null);
    setPaneThread(null);
    setPaneLoading(false);
    syncThreadInUrl(null);
  }, [syncThreadInUrl]);

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
      void fetch(`/api/dashboard/inbox/threads/${threadId}`, {
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(async (response) => {
          prefetchingRef.current.delete(threadId);
          if (!response.ok) {
            if (threadId === activeThreadIdRef.current) {
              setPaneLoading(false);
              setPaneThread(null);
              toast.error('Could not open thread');
            }
            return;
          }
          const data = (await response.json()) as MailThreadDetailDto;
          applyThreadDetail(threadId, data);
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

  const { execute: runAddContact } = useAction(addContact, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setAddedContacts((current) => ({
        ...current,
        [data.email]: { id: data.id, image: data.image }
      }));
      toast.success(
        data.created
          ? `Added ${data.name}`
          : `${data.name} is already in your contacts`
      );
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not add contact');
    }
  });
  const { execute: runRowMarkRead } = useAction(markMailThreadRead, {
    onError: ({ error, input }) => {
      patchThreads([input.threadId], { isUnread: true });
      toast.error(error.serverError || 'Could not update read state');
    }
  });

  const { execute: runRowPin } = useAction(pinMailThread, {
    onError: ({ error, input }) => {
      patchThreads([input.threadId], { isPinned: !input.isPinned });
      toast.error(error.serverError || 'Could not update pin');
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
      syncThreadInUrl(threadId);
      if (cached) {
        setPaneThread(cached);
        setPaneLoading(false);
        return;
      }
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
      syncThreadInUrl,
      threads
    ]
  );

  const selectThreadRef = React.useRef(selectThread);
  selectThreadRef.current = selectThread;

  React.useEffect(() => {
    if (!threadFromUrl || activeThreadIdRef.current === threadFromUrl) {
      return;
    }
    selectThreadRef.current(threadFromUrl);
  }, [threadFromUrl]);

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
    if (
      activeThreadId &&
      !valid.has(activeThreadId) &&
      activeThreadId !== threadFromUrl
    ) {
      clearPane();
    }
    for (const id of detailCacheRef.current.keys()) {
      if (!valid.has(id)) {
        detailCacheRef.current.delete(id);
      }
    }
  }, [threads, activeThreadId, clearPane, threadFromUrl]);

  const displayThreads = React.useMemo(() => {
    return threads
      .filter((thread) => !localOverrides[thread.id]?.removed)
      .map((thread) => {
        const override = localOverrides[thread.id];
        if (!override) return thread;
        return {
          ...thread,
          isUnread: override.isUnread ?? thread.isUnread,
          isPinned: override.isPinned ?? thread.isPinned,
          awaitingReply: override.awaitingReply ?? thread.awaitingReply,
          lastMessageAt: override.lastMessageAt ?? thread.lastMessageAt,
          tag: override.tag === undefined ? thread.tag : override.tag,
          assigneeName:
            override.assigneeName === undefined
              ? thread.assigneeName
              : override.assigneeName
        };
      })
      .toSorted((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
        );
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
        const pinCaughtUp =
          override.isPinned === undefined ||
          thread.isPinned === override.isPinned;
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

        if (
          unreadCaughtUp &&
          pinCaughtUp &&
          timeCaughtUp &&
          tagCaughtUp &&
          assigneeCaughtUp
        ) {
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
      toastMailDeleted(data?.count ?? 0, inTrash);
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

  const { execute: runBulkMove } = useAction(bulkMoveMailThreads, {
    onSuccess: () => {
      clearSelection();
      refreshInBackground();
    },
    onError: ({ error, input }) => {
      restoreThreads(input.threadIds);
      toast.error(error.serverError || 'Could not move threads');
    }
  });

  const { execute: runRowMove } = useAction(moveMailThreadFolder, {
    onSuccess: () => refreshInBackground(),
    onError: ({ error, input }) => {
      restoreThreads([input.threadId]);
      toast.error(error.serverError || 'Could not move thread');
    }
  });

  const { execute: runBlock } = useAction(blockMailSender, {
    onSuccess: ({ data }) => {
      toast.success(data?.email ? `Blocked ${data.email}` : 'Sender blocked');
      refreshInBackground();
    },
    onError: ({ error, input }) => {
      if (input.threadId) restoreThreads([input.threadId]);
      toast.error(error.serverError || 'Could not block sender');
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
        inArchive
          ? `Moved ${ids.length} to inbox`
          : inDrafts
            ? `Removed ${ids.length} from drafts`
            : `Archived ${ids.length}`
      );
      runBulkArchive({
        threadIds: ids,
        archive: !inArchive
      });
    },
    spamSelected: () => {
      const ids = selectedList;
      removeThreads(ids);
      toast.success(
        inSpam ? `Moved ${ids.length} to inbox` : `Marked ${ids.length} as spam`
      );
      runBulkMove({
        threadIds: ids,
        folder: inSpam ? 'INBOX' : 'SPAM'
      });
    },
    restoreSelected: () => {
      const ids = selectedList;
      removeThreads(ids);
      toast.success(`Moved ${ids.length} to inbox`);
      runBulkMove({ threadIds: ids, folder: 'INBOX' });
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
    folderView: view
  };

  const selectionActive = selectMode || selectedIds.size > 0;

  const threadRows = displayThreads.map((thread, index) => {
    return (
      <MailThreadRow
        key={thread.id}
        thread={thread}
        tags={tags}
        members={members}
        archivedView={inArchive}
        folderView={view}
        previewActive={activeThreadId === thread.id}
        showCheckboxes={selectionActive}
        selected={selectedIds.has(thread.id)}
        avatarEager={index < 12}
        onToggleSelected={(checked) => toggleOne(thread.id, checked)}
        onSelect={() => selectThread(thread.id)}
        onPrefetch={() => prefetchThread(thread.id)}
        onAskDelete={() => askDelete([thread.id])}
        onSwipeDelete={() => {
          removeThreads([thread.id]);
          runBulkDelete({ threadIds: [thread.id] });
        }}
        onArchive={(archive) => {
          removeThreads([thread.id]);
          toast.success(archive ? 'Archived' : 'Moved to inbox');
          runRowArchive({ threadId: thread.id, archive });
        }}
        onMoveFolder={(folder) => {
          removeThreads([thread.id]);
          toast.success(
            folder === 'SPAM'
              ? 'Marked as spam'
              : folder === 'TRASH'
                ? 'Moved to Trash'
                : 'Moved to inbox'
          );
          runRowMove({ threadId: thread.id, folder });
        }}
        onBlock={() => {
          setBlockThreadId(thread.id);
          setBlockOpen(true);
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
        onPin={(isPinned) => {
          patchThreads([thread.id], { isPinned });
          runRowPin({ threadId: thread.id, isPinned });
        }}
        contactId={
          (thread.fromAddress && addedContacts[thread.fromAddress]?.id) ||
          thread.contactId
        }
        contactImage={
          thread.fromAddress && addedContacts[thread.fromAddress]
            ? (addedContacts[thread.fromAddress]?.image ?? null)
            : thread.contactImage
        }
        onAddContact={
          thread.fromAddress
            ? () =>
                runAddContact({
                  email: thread.fromAddress ?? '',
                  name: thread.fromName ?? undefined
                })
            : undefined
        }
        swipeEnabled={!selectionActive}
        inTrash={inTrash}
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
      <MailThreadSwipeList
        label={`${view} conversations`}
        selectBar={
          !selectionHeader && selectionActive ? (
            <MailSelectAllBar
              allSelected={allSelected}
              someSelected={someSelected}
              selectedCount={selectedIds.size}
              onToggleAll={toggleAll}
            />
          ) : null
        }
        rows={threadRows}
        swipeEnabled={!selectionActive}
      />
    </div>
  ) : (
    <MailThreadSwipeList
      label={`${view} conversations`}
      className="h-full border border-border bg-background md:border-0"
      selectBar={
        !selectionHeader && selectionActive ? (
          <MailSelectAllBar
            allSelected={allSelected}
            someSelected={someSelected}
            selectedCount={selectedIds.size}
            onToggleAll={toggleAll}
          />
        ) : null
      }
      rows={threadRows}
      swipeEnabled={!selectionActive}
    />
  );

  const paneMatches =
    paneThread != null &&
    activeThreadId != null &&
    paneThread.id === activeThreadId;
  const openingThread =
    !paneMatches && activeThreadId
      ? threads.find((thread) => thread.id === activeThreadId)
      : undefined;

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
                      : {}),
                    ...(patch.isPinned !== undefined
                      ? { isPinned: patch.isPinned }
                      : {})
                  }
                : current
            );
          }}
        />
      ) : openingThread ? (
        <OpeningThreadPane thread={openingThread} />
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

  const blockThread = displayThreads.find(
    (thread) => thread.id === blockThreadId
  );

  const deleteDialog = (
    <DeleteMailThreadsDialog
      open={deleteOpen}
      count={deleteIds.length}
      mode={inTrash ? 'forever' : 'trash'}
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

  const blockDialog = (
    <BlockMailSenderDialog
      open={blockOpen}
      sender={blockThread?.fromAddress}
      onOpenChange={(open) => {
        setBlockOpen(open);
        if (!open) setBlockThreadId(null);
      }}
      onConfirm={() => {
        const threadId = blockThreadId;
        setBlockOpen(false);
        setBlockThreadId(null);
        if (!threadId) return;
        removeThreads([threadId]);
        runBlock({ threadId });
      }}
    />
  );

  if (isDesk) {
    return (
      <>
        <div className="flex h-full min-h-0 overflow-hidden">{split}</div>
        {deleteDialog}
        {blockDialog}
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
      {blockDialog}
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
      {selection.folderView === 'trash' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 font-mono text-[10px]"
          onClick={selection.restoreSelected}
        >
          Restore
        </Button>
      ) : selection.folderView === 'spam' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 font-mono text-[10px]"
          onClick={selection.spamSelected}
        >
          Not spam
        </Button>
      ) : (
        <>
          {selection.folderView !== 'drafts' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 font-mono text-[10px]"
              onClick={selection.archiveSelected}
            >
              {selection.folderView === 'archive' ? 'Move to inbox' : 'Archive'}
            </Button>
          ) : null}
          {selection.folderView !== 'archive' &&
          selection.folderView !== 'sent' &&
          selection.folderView !== 'drafts' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 font-mono text-[10px]"
              onClick={selection.spamSelected}
            >
              Spam
            </Button>
          ) : null}
        </>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={INBOX_BULK_DELETE_BUTTON_CLASS}
        onClick={selection.askDeleteSelected}
      >
        {selection.folderView === 'trash' ? 'Delete forever' : 'Delete'}
      </Button>
    </div>
  );
}

function MailSelectAllBar({
  allSelected,
  someSelected,
  selectedCount,
  onToggleAll
}: {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  onToggleAll: () => void;
}): React.JSX.Element {
  return (
    <div
      className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/60 bg-background px-4 py-2 sm:px-5"
      data-no-pull
    >
      <Checkbox
        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
        onCheckedChange={() => onToggleAll()}
        aria-label="Select all conversations"
        data-no-pull
      />
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {selectedCount} selected
      </span>
    </div>
  );
}

function MailThreadSwipeList({
  label,
  className,
  selectBar,
  rows,
  swipeEnabled
}: {
  label: string;
  className?: string;
  selectBar: React.ReactNode;
  rows: React.ReactNode[];
  swipeEnabled: boolean;
}): React.JSX.Element {
  if (rows.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden',
          className
        )}
      >
        {selectBar}
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nothing in this inbox yet.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}
    >
      {selectBar}
      <ul
        role="list"
        aria-label={label}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        {rows}
      </ul>
    </div>
  );
}

function MailThreadRow({
  thread,
  tags,
  members,
  archivedView,
  folderView,
  previewActive,
  showCheckboxes,
  selected,
  avatarEager,
  onToggleSelected,
  onSelect,
  onPrefetch,
  onAskDelete,
  onSwipeDelete,
  onArchive,
  onMoveFolder,
  onBlock,
  onAssign,
  onTag,
  onMarkRead,
  onPin,
  contactId = null,
  contactImage = null,
  onAddContact,
  swipeEnabled = false,
  inTrash = false
}: {
  thread: MailThreadListItem;
  tags: MailTagItem[];
  members: AssigneePerson[];
  archivedView: boolean;
  folderView: MailListFolder;
  previewActive: boolean;
  showCheckboxes: boolean;
  selected: boolean;
  avatarEager: boolean;
  onToggleSelected: (checked: boolean) => void;
  onSelect: () => void;
  onPrefetch: () => void;
  onAskDelete: () => void;
  onSwipeDelete?: () => void;
  onArchive: (archive: boolean) => void;
  onMoveFolder: (folder: 'INBOX' | 'SPAM' | 'TRASH') => void;
  onBlock: () => void;
  onAssign: (assigneeId: string | null) => void;
  onTag: (tagId: string | null) => void;
  onMarkRead: () => void;
  onPin: (isPinned: boolean) => void;
  contactId?: string | null;
  contactImage?: string | null;
  onAddContact?: () => void;
  swipeEnabled?: boolean;
  inTrash?: boolean;
}): React.JSX.Element {
  const rowRef = React.useRef<HTMLLIElement>(null);
  const longPressTimerRef = React.useRef<number | null>(null);
  const longPressTriggeredRef = React.useRef(false);
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

    onSelect();
  };

  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!showCheckboxes && (event.metaKey || event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      onToggleSelected(!selected);
      return;
    }

    openThread();
  };

  const commitPin = React.useCallback((): void => {
    const next = !thread.isPinned;
    onPin(next);
    toast.success(next ? 'Pinned to top' : 'Unpinned');
  }, [onPin, thread.isPinned]);

  const commitSwipeDelete = React.useCallback((): void => {
    toastMailDeleted(1, inTrash);
    onSwipeDelete?.();
  }, [inTrash, onSwipeDelete]);

  const rowClassName = cn(
    'message-item group relative border-b border-border last:border-b-0 [content-visibility:auto] [contain-intrinsic-size:auto_5.25rem]',
    thread.isPinned
      ? previewActive || selected
        ? 'bg-[color-mix(in_srgb,#f5a524_22%,transparent)]'
        : 'bg-[color-mix(in_srgb,#f5a524_14%,transparent)]'
      : localUnread && 'bg-[color-mix(in_srgb,#001afc_8%,transparent)]',
    !thread.isPinned &&
      previewActive &&
      (localUnread
        ? 'bg-[color-mix(in_srgb,#001afc_14%,transparent)]'
        : 'bg-foreground/[0.06]'),
    !thread.isPinned && selected && !localUnread && 'bg-foreground/[0.04]'
  );

  const rowInner = (
    <>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'relative flex w-full cursor-pointer items-start gap-3 px-3 py-3 pr-16 text-left transition-colors sm:px-3',
          thread.isPinned
            ? 'hover:bg-[color-mix(in_srgb,#f5a524_20%,transparent)]'
            : 'hover:bg-foreground/[0.04]'
        )}
        onClick={handleRowClick}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        onPointerDown={(event) => {
          if (showCheckboxes || event.button !== 0) return;
          onPrefetch();
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
          {contactImage || domain ? (
            <AvatarImage
              src={contactImage || getLogoUrl(domain ?? '', 64)}
              alt=""
              loading={avatarEager ? 'eager' : 'lazy'}
              decoding="async"
            />
          ) : null}
          <AvatarFallback className="rounded-md text-[10px] font-medium">
            {getInitials(label)}
          </AvatarFallback>
        </Avatar>

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
              className={cn(
                'shrink-0 font-mono text-[10px] text-muted-foreground transition-opacity group-hover:opacity-0 group-focus-within:opacity-0',
                (thread.isPinned || thread.hasAttachments) && 'opacity-0'
              )}
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
          className="pointer-events-auto flex items-center gap-0.5"
          onClick={stopRowEvent}
          onPointerDown={stopRowEvent}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'size-7 rounded-lg shadow-sm transition-opacity',
              thread.isPinned
                ? 'bg-[#f5a524] text-[#0A0D0D] hover:!bg-[#ffb43a] hover:!text-[#0A0D0D]'
                : 'pointer-events-none bg-background/95 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
            )}
            title={thread.isPinned ? 'Unpin' : 'Pin to top'}
            onClick={(event) => {
              stopRowEvent(event);
              playUiFeedbackSound('mail-pin');
              commitPin();
            }}
          >
            <PinIcon
              className={cn('size-3.5', thread.isPinned && 'fill-current')}
            />
            <span className="sr-only">
              {thread.isPinned ? 'Unpin' : 'Pin to top'}
            </span>
          </Button>
          {thread.hasAttachments ? (
            <MailThreadAttachmentsControl
              threadId={thread.id}
              hasAttachments
              size="row"
            />
          ) : null}

          {thread.isPinned ? null : (
            <div className="pointer-events-none flex items-center gap-0.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
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
                  <CheckIcon className="size-3.5 text-[#001afc]" />
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
                  <DropdownMenuItem
                    onSelect={() => {
                      playUiFeedbackSound('mail-pin');
                      commitPin();
                    }}
                  >
                    {thread.isPinned ? 'Unpin' : 'Pin to top'}
                  </DropdownMenuItem>
                  {folderView === 'trash' ? (
                    <DropdownMenuItem onSelect={() => onMoveFolder('INBOX')}>
                      Restore
                    </DropdownMenuItem>
                  ) : folderView === 'spam' ? (
                    <DropdownMenuItem onSelect={() => onMoveFolder('INBOX')}>
                      Not spam
                    </DropdownMenuItem>
                  ) : folderView === 'drafts' ? null : archivedView ? (
                    <DropdownMenuItem onSelect={() => onArchive(false)}>
                      Move to inbox
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => onArchive(true)}>
                      Archive
                    </DropdownMenuItem>
                  )}
                  {folderView !== 'spam' &&
                  folderView !== 'trash' &&
                  folderView !== 'sent' &&
                  folderView !== 'drafts' ? (
                    <DropdownMenuItem onSelect={() => onMoveFolder('SPAM')}>
                      Report spam
                    </DropdownMenuItem>
                  ) : null}
                  {onAddContact ? (
                    <DropdownMenuItem
                      disabled={Boolean(contactId)}
                      onSelect={onAddContact}
                    >
                      {contactId ? 'In your contacts' : 'Add to contacts'}
                    </DropdownMenuItem>
                  ) : null}
                  {folderView !== 'sent' &&
                  folderView !== 'trash' &&
                  folderView !== 'drafts' ? (
                    <DropdownMenuItem onSelect={onBlock}>
                      Block sender
                    </DropdownMenuItem>
                  ) : null}
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
                    {folderView === 'trash' ? ' forever' : ''}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const swipeEnabledForRow = swipeEnabled && Boolean(onSwipeDelete);

  return (
    <li
      ref={rowRef}
      className={rowClassName}
    >
      <MailThreadRowSwipe
        enabled={swipeEnabledForRow}
        rowRef={rowRef}
        pinLabel={thread.isPinned ? 'Unpin' : 'Pin'}
        deleteLabel={inTrash ? 'Delete forever' : 'Delete'}
        onPin={commitPin}
        onDelete={commitSwipeDelete}
      >
        {rowInner}
      </MailThreadRowSwipe>
    </li>
  );
}
