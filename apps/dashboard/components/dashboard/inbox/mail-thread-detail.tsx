'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@humaner/shared/icons';
import { format } from 'date-fns';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { addContact } from '@/actions/contacts/manage-contacts';
import { generateWorkspaceDocument } from '@/actions/inbox/generate-workspace-document';
import { fetchMailMessageBodies } from '@/actions/inbox/get-mail-thread';
import { blockMailSender } from '@/actions/inbox/manage-blocked-senders';
import {
  applyMailThreadTag,
  archiveMailThread,
  assignMailThread,
  deleteMailThread,
  markMailThreadRead,
  moveMailThreadFolder,
  pinMailThread
} from '@/actions/inbox/manage-mail-thread';
import { replyMailThread } from '@/actions/inbox/reply-mail-thread';
import { suggestMailThreadReplies } from '@/actions/inbox/suggest-mail-replies';
import { createTaskFromMailThreadAction } from '@/actions/tasks/create-task-from-mail-thread';
import { CompanionIcon } from '@/components/dashboard/ask-humaner/companion-icon';
import { COMPANION_ASSIGNEE_PERSON } from '@/components/dashboard/assignee-options';
import { useDashboardDockOptional } from '@/components/dashboard/dock/dashboard-dock-context';
import { BlockMailSenderDialog } from '@/components/dashboard/inbox/block-mail-sender-dialog';
import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import {
  DeleteMailThreadsDialog,
  readSkipDeleteWarning,
  requestMailDelete
} from '@/components/dashboard/inbox/delete-mail-threads-dialog';
import { useInboxPreferences } from '@/components/dashboard/inbox/inbox-preferences-context';
import { MailMessageAttachmentChips } from '@/components/dashboard/inbox/mail-attachments-control';
import { MailComposeBodyEditor } from '@/components/dashboard/inbox/mail-compose-body-editor';
import { MailDocumentCard } from '@/components/dashboard/inbox/mail-document-card';
import { MailDraftEditor } from '@/components/dashboard/inbox/mail-draft-editor';
import { MailMessageBody } from '@/components/dashboard/inbox/mail-message-body';
import { MailSignaturePreview } from '@/components/dashboard/inbox/mail-signature-preview';
import { MailThreadHeaderMenu } from '@/components/dashboard/inbox/mail-thread-task-menu';
import type { AssigneePerson } from '@/components/ui/assignees';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SendIcon, type SendIconHandle } from '@/components/ui/send-icon';
import { mailStatusToGlyph, StatusGlyph } from '@/components/ui/status-glyph';
import { Routes } from '@/constants/routes';
import type {
  MailTagItem,
  MailThreadDetail as MailThreadDetailDto
} from '@/data/inbox/get-mail-threads';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useOnboardingSound } from '@/hooks/use-onboarding-sound';
import {
  companyDomainFromEmail,
  normalizeContactEmail
} from '@/lib/contacts/contact-email';
import { COMPANION_ASSIGNEE } from '@/lib/inbox/mail-assignee-shared';
import { htmlToPlainText, isRichMailHtml } from '@/lib/inbox/mail-body-display';
import { detectMailDocumentIntent } from '@/lib/inbox/mail-document-intent';
import {
  buildForwardBody,
  buildForwardSubject
} from '@/lib/inbox/mail-forward';
import { tagsForAlias } from '@/lib/inbox/mail-tag-scope';
import { mailThreadStatusLabel } from '@/lib/inbox/mail-thread-status';
import { getLogoUrl } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

type Suggestion = { label: string; draft: string };
type SendPhase = 'idle' | 'sending' | 'success';

const accentSoftBg =
  'bg-[color-mix(in_srgb,var(--accent-color,#001afc)_10%,transparent)]';

const outboundCardBg =
  'bg-[color-mix(in_srgb,var(--accent-color,#001afc)_14%,transparent)]';
const inboundCardBg = 'bg-muted/70 dark:bg-white/[0.055]';

const engravedBarClassName = cn(
  'flex w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border px-2.5 py-2',
  'border-black/[0.08] bg-black/[0.045] dark:border-white/[0.10] dark:bg-black/40',
  'shadow-[inset_0_2px_8px_rgb(10_13_13/0.12),inset_0_1px_0_rgb(255_255_255/0.72),inset_0_-1px_0_rgb(10_13_13/0.10)]',
  'dark:shadow-[inset_0_3px_12px_rgb(0_0_0/0.62),inset_0_1px_0_rgb(255_255_255/0.12),inset_0_-1px_0_rgb(0_0_0/0.55)]',
  'backdrop-blur-md'
);

function useSwipeBack(
  onBack: () => void,
  enabled: boolean
): {
  onTouchStart: React.TouchEventHandler<HTMLElement>;
  onTouchEnd: React.TouchEventHandler<HTMLElement>;
} {
  const startXRef = React.useRef<number | null>(null);
  const startYRef = React.useRef(0);

  const onTouchStart = React.useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!enabled) return;
      const touch = event.touches[0];
      if (!touch || touch.clientX > 48) return;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
    },
    [enabled]
  );

  const onTouchEnd = React.useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!enabled || startXRef.current == null) return;
      const touch = event.changedTouches[0];
      const startX = startXRef.current;
      startXRef.current = null;
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startYRef.current;
      if (dx >= 64 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        onBack();
      }
    },
    [enabled, onBack]
  );

  return { onTouchStart, onTouchEnd };
}

function useThreadScrollDocked(
  ref: React.RefObject<HTMLDivElement | null>,
  resetKey: string
): boolean {
  const [docked, setDocked] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = (): void => {
      const overflow = el.scrollHeight - el.clientHeight;
      const remaining = overflow - el.scrollTop;
      setDocked((current) => {
        if (overflow < 12) return true;
        if (remaining <= 32) return true;
        if (remaining >= 88) return false;
        return current;
      });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [ref, resetKey]);

  return docked;
}

function shouldAutoSuggest(
  thread: MailThreadDetailDto,
  enabled: boolean
): boolean {
  if (!enabled) return false;
  if (!thread.isUnread) return false;
  const last = thread.messages[thread.messages.length - 1];
  return last?.direction === 'INBOUND';
}

function SuggestedReplySkeleton({
  widths
}: {
  widths: readonly [string, string];
}): React.JSX.Element {
  return (
    <li className="flex items-start gap-3 px-1 py-2">
      <span className="mt-0.5 size-6 shrink-0 animate-pulse rounded-lg bg-[#0a0d0d]/[0.08] dark:bg-white/[0.08]" />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
        <span
          className={cn(
            'h-3 animate-pulse rounded bg-[#0a0d0d]/[0.08] dark:bg-white/[0.08]',
            widths[0]
          )}
        />
        <span
          className={cn(
            'h-3 animate-pulse rounded bg-[#0a0d0d]/[0.08] dark:bg-white/[0.08]',
            widths[1]
          )}
        />
      </span>
    </li>
  );
}

function mailSnippet(bodyText: string | null, bodyHtml: string | null): string {
  const raw =
    bodyText?.trim() || (bodyHtml ? htmlToPlainText(bodyHtml).trim() : '');
  return raw.replace(/\s+/g, ' ').slice(0, 140);
}

function parseMailAddress(raw: string): { name: string | null; email: string } {
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match?.[2]) {
    const name = match[1]?.trim() || null;
    return { name: name || null, email: match[2].trim() };
  }
  return { name: null, email: raw.trim() };
}

function formatMailTimestamp(value: string): string {
  const date = new Date(value);
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'MMM d, h:mm a');
  }
  return format(date, 'MMM d, yyyy, h:mm a');
}

function ForwardGlyph({
  className
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'relative flex size-4 items-center justify-center',
        className
      )}
      aria-hidden
    >
      <ChevronRightIcon className="absolute size-3.5 -translate-x-1" />
      <ChevronRightIcon className="absolute size-3.5 translate-x-0.5" />
    </span>
  );
}

const MailThreadMessage = React.memo(function MailThreadMessage({
  message,
  subject,
  eager,
  expanded,
  avatarSrc,
  onToggle
}: {
  message: MailThreadDetailDto['messages'][number];
  subject: string;
  eager: boolean;
  expanded: boolean;
  avatarSrc: string | null;
  onToggle: () => void;
}): React.JSX.Element {
  const outbound = message.direction === 'OUTBOUND';
  const rich = isRichMailHtml(message.bodyHtml);
  const missingBody = !message.bodyHtml && !message.bodyText;
  const { name: fromName, email: fromEmail } = parseMailAddress(
    message.fromAddress
  );
  const displayName = fromName || fromEmail;

  return (
    <li>
      <article
        className={cn(
          'space-y-3 rounded-xl px-3 py-3 sm:px-4',
          outbound ? outboundCardBg : inboundCardBg
        )}
      >
        <div
          role="button"
          tabIndex={0}
          className="flex w-full cursor-pointer items-start gap-3 px-0.5 text-left"
          onClick={onToggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggle();
            }
          }}
          aria-expanded={expanded}
        >
          <Avatar className="size-10 shrink-0">
            {avatarSrc ? (
              <AvatarImage
                src={avatarSrc}
                alt=""
                loading={eager ? 'eager' : 'lazy'}
                decoding="async"
              />
            ) : null}
            <AvatarFallback className="text-[11px] font-medium">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-5">
                  {displayName}
                  <span
                    className={cn(
                      'ml-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em]',
                      outbound
                        ? 'text-[color:var(--accent-color,#001afc)]'
                        : 'text-muted-foreground'
                    )}
                  >
                    {outbound ? 'Sent' : 'Received'}
                  </span>
                  {fromName ? (
                    <span className="ml-1.5 font-info text-muted-foreground">
                      &lt;{fromEmail}&gt;
                    </span>
                  ) : null}
                </p>
                {expanded ? (
                  <p className="mt-0.5 truncate font-info text-xs text-muted-foreground">
                    To {message.toAddresses.join(', ')}
                  </p>
                ) : (
                  <p className="mt-0.5 truncate font-info text-xs text-muted-foreground">
                    {mailSnippet(message.bodyText, message.bodyHtml) ||
                      'Show message'}
                  </p>
                )}
              </div>
              <time
                dateTime={message.sentAt}
                className="shrink-0 pt-0.5 font-info text-xs text-muted-foreground"
              >
                {formatMailTimestamp(message.sentAt)}
              </time>
            </div>
          </div>
        </div>

        {expanded ? (
          <div className={cn(!rich && 'px-0.5')}>
            {missingBody ? (
              <div className="mt-1 h-24 animate-pulse rounded-md bg-muted/40" />
            ) : (
              <MailMessageBody
                bodyHtml={message.bodyHtml}
                bodyText={message.bodyText}
                subject={subject}
                className="mt-0"
                eager
              />
            )}
            <MailMessageAttachmentChips attachments={message.attachments} />
          </div>
        ) : null}
      </article>
    </li>
  );
});

export function MailThreadDetail({
  thread: threadProp,
  tags = [],
  members = [],
  embedded = false,
  onClosed,
  onRemoved,
  onPatched
}: {
  thread: MailThreadDetailDto;
  tags?: MailTagItem[];
  members?: AssigneePerson[];
  /** When true, fills a reading pane and skips leave-list navigation. */
  embedded?: boolean;
  onClosed?: () => void;
  /** Instantly remove from the list (delete / archive out of view). */
  onRemoved?: () => void;
  onPatched?: (patch: {
    tag?: MailTagItem | null;
    isUnread?: boolean;
    isPinned?: boolean;
    assigneeId?: string | null;
    assigneeKind?: string;
  }) => void;
}): React.JSX.Element {
  const router = useRouter();
  const dock = useDashboardDockOptional();
  const { autoSuggestReplies } = useInboxPreferences();
  const { openCompose } = useComposeMail();
  const { play } = useOnboardingSound();
  const [thread, setThread] = React.useState(threadProp);
  React.useEffect(() => {
    setThread((current) => {
      if (current.id !== threadProp.id) return threadProp;
      const loadedById = new Map(
        current.messages
          .filter((message) => message.bodyHtml || message.bodyText)
          .map((message) => [message.id, message])
      );
      if (loadedById.size === 0) return threadProp;
      return {
        ...threadProp,
        messages: threadProp.messages.map(
          (message) => loadedById.get(message.id) ?? message
        )
      };
    });
  }, [threadProp]);

  const noteCount = thread.notes?.length ?? 0;
  const notesOpen =
    dock?.activeMode === 'team' &&
    dock.teamTab === 'notes' &&
    dock.notesFocus?.threadId === thread.id;

  const openThreadNotes = React.useCallback(() => {
    dock?.openDock('team', {
      teamTab: 'notes',
      notesFocus: {
        threadId: thread.id,
        subject: thread.subject,
        sharedNoteDraft: thread.sharedNoteDraft ?? null
      }
    });
  }, [dock, thread.id, thread.sharedNoteDraft, thread.subject]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('notes') === '1' || params.get('panel') === 'notes') {
      openThreadNotes();
    }
  }, [openThreadNotes]);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    const messages = threadProp.messages;
    const start =
      messages.length <= 3
        ? Math.max(0, messages.length - 2)
        : messages.length - 1;
    return new Set(messages.slice(start).map((message) => message.id));
  });
  React.useEffect(() => {
    const messages = threadProp.messages;
    const start =
      messages.length <= 3
        ? Math.max(0, messages.length - 2)
        : messages.length - 1;
    setExpandedIds(new Set(messages.slice(start).map((message) => message.id)));
    // Only re-expand when switching threads, not when message bodies load.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- thread id is the switch key
  }, [threadProp.id]);

  const lastMessageId = thread.messages[thread.messages.length - 1]?.id ?? null;
  React.useEffect(() => {
    if (!lastMessageId) return;
    setExpandedIds((current) => {
      if (current.has(lastMessageId)) return current;
      const next = new Set(current);
      next.add(lastMessageId);
      return next;
    });
  }, [lastMessageId]);

  const loadingBodiesRef = React.useRef(new Set<string>());
  const loadMessageBody = React.useCallback(
    (messageId: string) => {
      if (loadingBodiesRef.current.has(messageId)) return;
      loadingBodiesRef.current.add(messageId);
      void fetchMailMessageBodies({
        threadId: thread.id,
        messageIds: [messageId]
      })
        .then((result) => {
          loadingBodiesRef.current.delete(messageId);
          const rows = result?.data;
          if (!rows?.length) return;
          const byId = new Map(rows.map((row) => [row.id, row]));
          setThread((current) => ({
            ...current,
            messages: current.messages.map((message) => {
              const row = byId.get(message.id);
              return row
                ? {
                    ...message,
                    bodyHtml: row.bodyHtml,
                    bodyText: row.bodyText
                  }
                : message;
            })
          }));
        })
        .catch(() => {
          loadingBodiesRef.current.delete(messageId);
        });
    },
    [thread.id]
  );

  React.useEffect(() => {
    for (const message of thread.messages) {
      if (!expandedIds.has(message.id)) continue;
      if (message.bodyHtml || message.bodyText) continue;
      loadMessageBody(message.id);
    }
  }, [expandedIds, loadMessageBody, thread.messages]);

  const applicableTags = tagsForAlias(tags, thread.aliasId);
  const sendIconRef = React.useRef<SendIconHandle>(null);
  const successTimerRef = React.useRef<number | null>(null);
  const [body, setBody] = React.useState('');
  const [bodyHtml, setBodyHtml] = React.useState<string | null>(null);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [sendAliasId, setSendAliasId] = React.useState(threadProp.aliasId);
  const composerRef = React.useRef<HTMLDivElement>(null);
  const threadScrollRef = React.useRef<HTMLDivElement>(null);
  const dockedAtBottom = useThreadScrollDocked(threadScrollRef, thread.id);
  const showFloatingBar = !composerOpen && !dockedAtBottom;
  const [suggesting, setSuggesting] = React.useState(() =>
    shouldAutoSuggest(threadProp, autoSuggestReplies)
  );
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [sendPhase, setSendPhase] = React.useState<SendPhase>('idle');
  const markedReadRef = React.useRef(false);
  const isArchived = Boolean(thread.archivedAt);
  const folder = thread.folder;
  const inTrash = folder === 'TRASH';
  const inSpam = folder === 'SPAM';
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [skipDeleteWarning, setSkipDeleteWarning] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);

  React.useEffect(() => {
    setSkipDeleteWarning(readSkipDeleteWarning());
  }, []);

  const leaveOrClose = React.useCallback(() => {
    if (embedded) {
      onClosed?.();
      router.refresh();
      return;
    }
    router.push(folder === 'DRAFT' ? Routes.InboxDrafts : Routes.InboxAll);
    router.refresh();
  }, [embedded, folder, onClosed, router]);

  const removeAndClose = React.useCallback(() => {
    onRemoved?.();
    leaveOrClose();
  }, [leaveOrClose, onRemoved]);

  const isMobilePane = useMediaQuery('(max-width: 767px)', {
    ssr: false,
    fallback: false
  });
  const swipeBack = useSwipeBack(leaveOrClose, isMobilePane);

  const { execute: sendReply, isExecuting } = useAction(replyMailThread, {
    onSuccess: () => {
      setSendPhase('success');
      play('validate');
      toast.success('Reply sent');
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = window.setTimeout(() => {
        setBody('');
        setBodyHtml(null);
        setComposerOpen(false);
        setSuggesting(false);
        setSuggestions([]);
        setSelectedIndex(null);
        setSendPhase('idle');
        sendIconRef.current?.stopAnimation();
        router.refresh();
      }, 720);
    },
    onError: ({ error }) => {
      setSendPhase('idle');
      sendIconRef.current?.stopAnimation();
      toast.error(error.serverError || 'Could not send reply');
    }
  });

  const { execute: markRead } = useAction(markMailThreadRead);
  const [addedContact, setAddedContact] = React.useState<{
    email: string;
    id: string;
    image: string | null;
  } | null>(null);
  React.useEffect(() => {
    setAddedContact(null);
  }, [thread.id]);
  const { execute: runAddContact } = useAction(addContact, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setAddedContact({
        email: data.email,
        id: data.id,
        image: data.image
      });
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

  const { execute: runArchive } = useAction(archiveMailThread, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not archive')
  });

  const { execute: runMove } = useAction(moveMailThreadFolder, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) => toast.error(error.serverError || 'Could not move')
  });

  const { execute: runBlock } = useAction(blockMailSender, {
    onSuccess: ({ data }) => {
      toast.success(data?.email ? `Blocked ${data.email}` : 'Sender blocked');
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not block sender')
  });

  const { execute: runDelete } = useAction(deleteMailThread, {
    onSuccess: () => {
      toast.success(inTrash ? 'Deleted 1' : 'Moved to Trash');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError || 'Could not delete')
  });

  const { execute: runAssign } = useAction(assignMailThread, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) => toast.error(error.serverError || 'Could not assign')
  });

  const { execute: runTag } = useAction(applyMailThreadTag, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) => toast.error(error.serverError || 'Could not tag')
  });

  const handleArchive = (archive: boolean): void => {
    // Archive / move-to-inbox always leave the current list view immediately.
    removeAndClose();
    toast.success(archive ? 'Archived' : 'Moved to inbox');
    runArchive({ threadId: thread.id, archive });
  };

  const handleMoveFolder = (next: 'INBOX' | 'SPAM'): void => {
    removeAndClose();
    toast.success(
      next === 'SPAM'
        ? 'Marked as spam'
        : inTrash
          ? 'Restored'
          : 'Moved to inbox'
    );
    runMove({ threadId: thread.id, folder: next });
  };

  const handleBlock = (): void => {
    setBlockOpen(true);
  };

  const confirmBlock = (): void => {
    removeAndClose();
    runBlock({ threadId: thread.id });
  };

  const handleDelete = (): void => {
    removeAndClose();
    runDelete({ threadId: thread.id });
  };

  const { execute: createTask, isExecuting: creatingTask } = useAction(
    createTaskFromMailThreadAction,
    {
      onSuccess: ({ data }) => {
        if (!data) return;
        setThread((current) => ({
          ...current,
          handoffTicketId: data.id,
          handoffTicketNumber: data.ticketNumber
        }));
        toast.success(
          data.existing
            ? `Task #${String(data.ticketNumber).padStart(5, '0')} already exists`
            : `Task #${String(data.ticketNumber).padStart(5, '0')} created`
        );
      },
      onError: ({ error }) =>
        toast.error(error.serverError || 'Could not create task')
    }
  );

  const handleAssign = (assigneeId: string | null): void => {
    const assigneeKind =
      assigneeId === COMPANION_ASSIGNEE
        ? 'COMPANION'
        : assigneeId
          ? 'HUMAN'
          : 'UNASSIGNED';
    setThread((current) => ({
      ...current,
      assigneeId: assigneeId === COMPANION_ASSIGNEE ? null : assigneeId,
      assigneeKind
    }));
    onPatched?.({
      assigneeId: assigneeId === COMPANION_ASSIGNEE ? null : assigneeId,
      assigneeKind
    });
    toast.success('Assigned');
    runAssign({ threadId: thread.id, assigneeId });
  };

  const handleTag = (tagId: string | null): void => {
    const tag =
      tagId == null
        ? null
        : (applicableTags.find((item) => item.id === tagId) ?? null);
    setThread((current) => ({ ...current, tag }));
    onPatched?.({ tag });
    toast.success('Tag updated');
    runTag({ threadId: thread.id, tagId });
  };

  const { execute: runPin } = useAction(pinMailThread, {
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not update pin')
  });

  const handlePin = (): void => {
    const next = !thread.isPinned;
    setThread((current) => ({ ...current, isPinned: next }));
    onPatched?.({ isPinned: next });
    runPin({ threadId: thread.id, isPinned: next });
  };

  const { execute: runGenerateDocument, isExecuting: generatingDocument } =
    useAction(generateWorkspaceDocument, {
      onSuccess: ({ data }) => {
        if (!data) return;
        setThread((current) => ({
          ...current,
          document: {
            id: data.id,
            kind: data.kind,
            status: data.status,
            reference: data.reference,
            counterpartyName: data.counterpartyName,
            counterpartyEmail: data.counterpartyEmail,
            amountCents: data.amountCents,
            currency: data.currency,
            dueAt: data.dueAt,
            issuedAt: data.issuedAt
          }
        }));
        toast.success(
          data.kind === 'QUOTE' ? 'Quote generated' : 'Invoice generated'
        );
      },
      onError: ({ error }) =>
        toast.error(error.serverError || 'Could not generate document')
    });

  const { execute: loadSuggestions, isExecuting: loadingSuggestions } =
    useAction(suggestMailThreadReplies, {
      onSuccess: ({ data }) => {
        setSuggestions(data?.suggestions ?? []);
      },
      onError: () => {
        setSuggesting(false);
        toast.error('Could not load reply suggestions');
      }
    });

  React.useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    markedReadRef.current = false;
    setSuggesting(shouldAutoSuggest(thread, autoSuggestReplies));
    setSuggestions([]);
    setSelectedIndex(null);
    setComposerOpen(false);
    setBody('');
    setBodyHtml(null);
    setSendAliasId(thread.aliasId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id]);

  React.useEffect(() => {
    if (!composerOpen) return;
    const editable = composerRef.current?.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    editable?.focus();
  }, [composerOpen]);

  React.useEffect(() => {
    if (embedded) return;
    if (!thread.isUnread || markedReadRef.current) return;
    markedReadRef.current = true;
    onPatched?.({ isUnread: false });
    markRead({ threadId: thread.id, isUnread: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, thread.id]);

  React.useEffect(() => {
    if (!suggesting) return;
    loadSuggestions({ threadId: thread.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id, suggesting]);

  React.useEffect(() => {
    if (sendPhase === 'sending' || isExecuting) {
      sendIconRef.current?.startAnimation();
    } else if (sendPhase === 'idle') {
      sendIconRef.current?.stopAnimation();
    }
  }, [isExecuting, sendPhase]);

  const firstInbound = thread.messages.find(
    (message) => message.direction === 'INBOUND'
  );
  let latestInbound = firstInbound;
  let latestOutboundTo: string | null = null;
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const message = thread.messages[i];
    if (!message) continue;
    if (message.direction === 'INBOUND' && !latestInbound) {
      latestInbound = message;
    }
    if (message.direction === 'OUTBOUND' && !latestOutboundTo) {
      latestOutboundTo = message.toAddresses[0] ?? null;
    }
  }
  const senderAddress =
    firstInbound?.fromAddress ?? latestInbound?.fromAddress ?? latestOutboundTo;
  const senderMatch = senderAddress?.match(/^(.*?)\s*<([^>]+)>$/);
  const senderName = senderMatch?.[1]?.trim() || null;
  const senderEmail = (
    senderMatch?.[2]?.trim() ||
    senderMatch?.[1]?.trim() ||
    senderAddress ||
    'Unknown sender'
  ).trim();
  const senderLabel = senderName
    ? `${senderName} · ${senderEmail}`
    : senderEmail;
  const threadAttachments = thread.messages.flatMap(
    (message) => message.attachments
  );
  const latestMessage = thread.messages[thread.messages.length - 1];
  const suggestedDocument = latestMessage
    ? detectMailDocumentIntent({
        subject: thread.subject,
        fromAddress: latestMessage.fromAddress,
        bodyText: latestMessage.bodyText,
        bodyHtml: latestMessage.bodyHtml
      })
    : null;
  const generateKind =
    suggestedDocument &&
    thread.document?.kind !== suggestedDocument.toUpperCase()
      ? suggestedDocument
      : null;
  const senderMailbox = normalizeContactEmail(senderEmail);
  const contactByEmail = new Map(
    (thread.savedContacts ?? []).map((contact) => [contact.email, contact])
  );
  if (addedContact) {
    contactByEmail.set(addedContact.email, addedContact);
  }
  const senderContact = senderMailbox
    ? contactByEmail.get(senderMailbox)
    : undefined;
  const avatarForAddress = (raw: string): string | null => {
    const email = normalizeContactEmail(raw);
    const saved = email ? contactByEmail.get(email) : undefined;
    if (saved?.image) return saved.image;
    const domain = email ? companyDomainFromEmail(email) : null;
    return domain ? getLogoUrl(domain, 64) : null;
  };
  const headerAvatar = avatarForAddress(senderEmail);
  const toName =
    senderMatch?.[1]?.trim() ||
    senderMatch?.[2]?.trim() ||
    senderAddress ||
    'sender';

  const discardSuggestions = (): void => {
    setSuggesting(false);
    setSuggestions([]);
    setSelectedIndex(null);
  };

  const suggestAgain = (): void => {
    setSuggestions([]);
    setSelectedIndex(null);
    setComposerOpen(false);
    setBody('');
    setBodyHtml(null);
    setSuggesting(true);
    loadSuggestions({ threadId: thread.id });
  };

  const pickSuggestion = (index: number): void => {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    setSelectedIndex(index);
    setBody(suggestion.draft);
    setBodyHtml(null);
    setComposerOpen(true);
  };

  const handleSend = (): void => {
    if (body.trim().length === 0 || isExecuting || sendPhase !== 'idle') return;
    setSendPhase('sending');
    sendIconRef.current?.startAnimation();
    sendReply({
      threadId: thread.id,
      aliasId: sendAliasId,
      body,
      ...(bodyHtml ? { bodyHtml } : {})
    });
  };

  const suggestionsReady =
    suggesting && !loadingSuggestions && suggestions.length > 0;
  const suggestionsLoading =
    suggesting && (loadingSuggestions || suggestions.length === 0);

  const openReply = (): void => {
    setComposerOpen(true);
    setSuggesting(false);
  };

  const openForward = (): void => {
    const last = thread.messages[thread.messages.length - 1];
    if (!last) {
      toast.error('Nothing to forward');
      return;
    }
    openCompose(thread.aliasId, {
      title: 'Forward',
      subject: buildForwardSubject(thread.subject),
      body: buildForwardBody({
        fromAddress: last.fromAddress,
        sentAt: last.sentAt,
        subject: thread.subject,
        bodyHtml: last.bodyHtml,
        bodyText: last.bodyText
      })
    });
  };

  const actionButtonClassName =
    'pointer-events-auto h-9 gap-2 px-4 hover:border-black/10 hover:bg-white dark:hover:border-white/20 dark:hover:bg-[#1c1c1c]';

  const renderActionButtons = (): React.JSX.Element => (
    <>
      <Button
        type="button"
        variant="background"
        size="sm"
        className={actionButtonClassName}
        onClick={openReply}
      >
        <ArrowRightIcon className="size-3.5 rotate-180" />
        Reply
      </Button>
      <Button
        type="button"
        variant="background"
        size="sm"
        className={actionButtonClassName}
        onClick={openForward}
      >
        <ForwardGlyph className="size-3.5" />
        Forward
      </Button>
      {!suggesting ? (
        <Button
          type="button"
          variant="background"
          size="sm"
          className={actionButtonClassName}
          onClick={suggestAgain}
        >
          <CompanionIcon
            active
            size={16}
            state="idle"
            className="size-4"
          />
          Suggest
        </Button>
      ) : null}
    </>
  );

  const assignValue =
    thread.assigneeKind === 'COMPANION'
      ? COMPANION_ASSIGNEE
      : (thread.assigneeId ?? null);
  const assignPerson =
    assignValue === COMPANION_ASSIGNEE
      ? COMPANION_ASSIGNEE_PERSON
      : (members.find((member) => member.id === assignValue) ?? null);

  if (thread.folder === 'DRAFT') {
    return (
      <MailDraftEditor
        thread={thread}
        onClosed={leaveOrClose}
        onSent={removeAndClose}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-col bg-background',
        embedded ? 'h-full' : 'min-h-[32rem]'
      )}
      onTouchStart={swipeBack.onTouchStart}
      onTouchEnd={swipeBack.onTouchEnd}
    >
      {isMobilePane ? (
        <button
          type="button"
          onClick={leaveOrClose}
          aria-label="Back to inbox"
          title="Swipe right or tap to go back"
          className="absolute left-0 top-1/2 z-30 flex h-16 w-7 -translate-y-1/2 items-center justify-center rounded-r-full border border-l-0 border-border/70 bg-background/90 text-muted-foreground shadow-[0_8px_24px_-12px_rgb(10_13_13/0.45)] backdrop-blur-md"
        >
          <ChevronLeftIcon
            className="size-4"
            strokeWidth={2}
          />
        </button>
      ) : null}
      <header
        className={cn(
          'flex shrink-0 items-start gap-3 border-b border-border bg-background px-5 py-4 max-md:pl-9'
        )}
      >
        <Avatar className="size-9 shrink-0 rounded-md">
          {headerAvatar ? (
            <AvatarImage
              src={headerAvatar}
              alt=""
              loading="eager"
              decoding="async"
            />
          ) : null}
          <AvatarFallback className="rounded-md text-[11px] font-medium">
            {getInitials(senderName || senderEmail)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 truncate font-display text-lg font-normal tracking-tight">
              {thread.subject || '(no subject)'}
            </h1>
            <span
              className="shrink-0"
              title={
                thread.tag
                  ? `${thread.tag.name} · ${mailThreadStatusLabel(thread.status)}`
                  : mailThreadStatusLabel(thread.status)
              }
            >
              <StatusGlyph
                kind={mailStatusToGlyph(thread.status)}
                color={thread.tag?.color}
              />
            </span>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {senderLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {thread.isUnread ? (
            <span
              className="mr-1 size-1.5 rounded-full"
              style={{ backgroundColor: '#001afc' }}
              title="Unread"
            />
          ) : null}
          <MailThreadHeaderMenu
            threadId={thread.id}
            subject={thread.subject}
            ticketNumber={thread.handoffTicketNumber}
            creatingTask={creatingTask}
            onCreateTask={() => createTask({ threadId: thread.id })}
            assignValue={assignValue}
            assignPerson={assignPerson}
            members={members}
            onAssign={handleAssign}
            tags={applicableTags}
            currentTag={thread.tag}
            onTag={handleTag}
            isPinned={Boolean(thread.isPinned)}
            onPin={handlePin}
            notesOpen={notesOpen}
            noteCount={noteCount}
            onNotes={openThreadNotes}
            onReply={openReply}
            onForward={openForward}
            folder={folder}
            inTrash={inTrash}
            inSpam={inSpam}
            isArchived={isArchived}
            onArchive={handleArchive}
            onMoveFolder={handleMoveFolder}
            onBlock={handleBlock}
            onAddContact={
              senderMailbox
                ? () =>
                    runAddContact({
                      email: senderMailbox,
                      name: senderName ?? undefined
                    })
                : undefined
            }
            contactSaved={Boolean(senderContact)}
            attachments={threadAttachments}
            hasAttachments={
              thread.hasAttachments || threadAttachments.length > 0
            }
            suggestedDocument={generateKind}
            generatingDocument={generatingDocument}
            onGenerateDocument={
              generateKind
                ? (kind) => runGenerateDocument({ threadId: thread.id, kind })
                : undefined
            }
            onDelete={() => {
              requestMailDelete(
                skipDeleteWarning,
                () => setDeleteOpen(true),
                handleDelete
              );
            }}
          />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {thread.document ? (
          <MailDocumentCard
            document={thread.document}
            brand={
              thread.brand ?? {
                name: 'Workspace',
                email: null,
                logoUrl: null,
                website: null,
                address: null,
                phone: null,
                taxId: null
              }
            }
          />
        ) : null}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            ref={threadScrollRef}
            className="min-h-0 flex-1 overflow-y-auto bg-background"
          >
            <div
              className={cn(
                'mx-auto w-full max-w-3xl space-y-4 px-4 py-5 max-md:pl-9 sm:px-6',
                showFloatingBar && 'pb-24'
              )}
            >
              <ol className="space-y-4">
                {thread.messages.map((message, index) => (
                  <MailThreadMessage
                    key={message.id}
                    message={message}
                    subject={thread.subject}
                    eager={index >= thread.messages.length - 2}
                    avatarSrc={avatarForAddress(message.fromAddress)}
                    expanded={expandedIds.has(message.id)}
                    onToggle={() => {
                      setExpandedIds((current) => {
                        const next = new Set(current);
                        if (next.has(message.id)) {
                          if (thread.messages.length === 1) return current;
                          next.delete(message.id);
                        } else {
                          next.add(message.id);
                        }
                        return next;
                      });
                    }}
                  />
                ))}
              </ol>

              {suggesting ? (
                <article className="w-full rounded-lg bg-[#f2f2f2] px-5 py-4 dark:bg-[#0A0D0D]">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CompanionIcon
                          active
                          size={20}
                          state={suggestionsLoading ? 'thinking' : 'enter'}
                          className="size-5"
                        />
                        <p className="truncate font-fellix text-sm font-medium">
                          Suggested reply
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        To:{' '}
                        <span style={{ color: 'var(--accent-color, #001afc)' }}>
                          {toName}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 font-mono"
                        disabled={loadingSuggestions}
                        onClick={suggestAgain}
                      >
                        Suggest again
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 font-mono"
                        onClick={discardSuggestions}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {suggestionsLoading ? (
                    <ul className="mt-3">
                      <SuggestedReplySkeleton widths={['w-[88%]', 'w-[62%]']} />
                      <SuggestedReplySkeleton widths={['w-[94%]', 'w-[48%]']} />
                    </ul>
                  ) : suggestionsReady ? (
                    <ul className="mt-3 space-y-1">
                      {suggestions.map((suggestion, index) => {
                        const active = selectedIndex === index;
                        return (
                          <li key={`${suggestion.label}-${index}`}>
                            <button
                              type="button"
                              onClick={() => pickSuggestion(index)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left text-sm transition-colors',
                                active ? accentSoftBg : 'hover:bg-muted/60'
                              )}
                            >
                              <span
                                className={cn(
                                  'flex size-6 shrink-0 items-center justify-center rounded-lg font-mono text-[11px]',
                                  active
                                    ? 'text-foreground'
                                    : 'bg-muted text-muted-foreground'
                                )}
                                style={
                                  active
                                    ? {
                                        backgroundColor:
                                          'color-mix(in srgb, var(--accent-color, #001afc) 28%, transparent)'
                                      }
                                    : undefined
                                }
                              >
                                {index + 1}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {suggestion.label}
                              </span>
                              {active ? (
                                <CheckIcon
                                  className="size-3.5 shrink-0"
                                  style={{
                                    color: 'var(--accent-color, #001afc)'
                                  }}
                                />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </article>
              ) : null}

              {composerOpen ? (
                <section className="w-full rounded-lg bg-[#f2f2f2] px-5 py-4 dark:bg-[#0A0D0D]">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Reply</p>
                      {(thread.sendAliases ?? []).length > 1 ? (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="shrink-0 text-xs text-muted-foreground">
                            From
                          </span>
                          <Select
                            value={sendAliasId}
                            onValueChange={setSendAliasId}
                            disabled={sendPhase !== 'idle'}
                          >
                            <SelectTrigger className="h-8 w-auto min-w-48 max-w-72 rounded-lg font-mono text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(thread.sendAliases ?? []).map((alias) => (
                                <SelectItem
                                  key={alias.id}
                                  value={alias.id}
                                >
                                  {alias.address}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Sends from {thread.aliasAddress}
                        </p>
                      )}
                    </div>
                    {!suggesting ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 font-mono"
                        onClick={suggestAgain}
                      >
                        Suggest again
                      </Button>
                    ) : null}
                  </div>
                  <div ref={composerRef}>
                    <MailComposeBodyEditor
                      value={body}
                      onChange={(next) => {
                        setBody(next.text);
                        setBodyHtml(next.html);
                      }}
                      disabled={sendPhase !== 'idle'}
                      placeholder="Write your reply…"
                      contentClassName="min-h-40 px-0"
                    />
                    <MailSignaturePreview
                      text={thread.signatureText}
                      iconUrl={thread.signatureIconUrl}
                      iconHeight={thread.signatureIconHeight}
                      className="mt-3"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 font-mono"
                      disabled={sendPhase !== 'idle'}
                      onClick={() => setComposerOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 min-w-[7.5rem] px-4 font-mono"
                      disabled={
                        sendPhase === 'sending' ||
                        (sendPhase === 'idle' && body.trim().length === 0)
                      }
                      onClick={handleSend}
                    >
                      {sendPhase === 'success' ? (
                        <CheckIcon className="size-4 animate-in zoom-in-50 fade-in duration-200" />
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          {sendPhase === 'idle' ? 'Send' : null}
                          <SendIcon
                            ref={sendIconRef}
                            size={16}
                          />
                        </span>
                      )}
                    </Button>
                  </div>
                </section>
              ) : null}

              {!composerOpen ? (
                <div
                  className={cn(
                    engravedBarClassName,
                    'transition-opacity duration-300',
                    dockedAtBottom
                      ? 'opacity-100'
                      : 'pointer-events-none opacity-0'
                  )}
                  aria-hidden={!dockedAtBottom}
                  inert={!dockedAtBottom || undefined}
                >
                  {renderActionButtons()}
                </div>
              ) : null}
            </div>
          </div>

          {!composerOpen ? (
            <div
              className={cn(
                'absolute bottom-3 left-1/2 z-30 -translate-x-1/2 sm:bottom-4',
                !showFloatingBar && 'pointer-events-none'
              )}
            >
              <div
                className={cn('t-panel-slide', engravedBarClassName)}
                data-mail-action-bar=""
                data-open={showFloatingBar ? 'true' : 'false'}
                onMouseLeave={() => {
                  document.body.removeAttribute('data-mail-action-bar-hot');
                }}
              >
                {renderActionButtons()}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <DeleteMailThreadsDialog
        open={deleteOpen}
        count={1}
        mode={inTrash ? 'forever' : 'trash'}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          setSkipDeleteWarning(readSkipDeleteWarning());
          handleDelete();
        }}
      />
      <BlockMailSenderDialog
        open={blockOpen}
        sender={senderEmail}
        onOpenChange={setBlockOpen}
        onConfirm={confirmBlock}
      />
    </div>
  );
}
