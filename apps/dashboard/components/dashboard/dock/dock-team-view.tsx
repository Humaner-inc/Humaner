'use client';

import * as React from 'react';
import {
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MAX_COUNT,
  encodeChatAttachments
} from '@humaner/shared/chat-attachments';
import {
  ChevronDownIcon,
  FileTextIcon,
  MessageCircleIcon,
  Paperclip,
  Trash2Icon,
  XIcon
} from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { deleteMailThreadNotesAction } from '@/actions/inbox/manage-mail-notes';
import {
  loadTeamWorkspaceFeed,
  sendTeamMessageAction
} from '@/actions/team/manage-team-messages';
import { ChatPlainSendButton } from '@/components/chat/chat-plain-send-button';
import { FeatureIntroEmpty } from '@/components/dashboard/desk/feature-intro-empty';
import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { useDockNotifications } from '@/components/dashboard/dock/dock-notifications-context';
import { MailThreadNotesPanel } from '@/components/dashboard/inbox/mail-thread-notes-panel';
import {
  MentionBody,
  MentionComposer
} from '@/components/dashboard/team/mention-composer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import type {
  TeamMessageItem,
  TeamNoteItem,
  TeamWorkspaceFeed
} from '@/data/team/get-team-workspace';
import { useMemberAccentColor } from '@/hooks/use-member-accent-color';
import {
  teamAttachmentHref,
  type TeamMessageAttachment
} from '@/lib/team/message-attachments';
import { cn, getInitials } from '@/lib/utils';

type TeamTab = 'notes' | 'messages';

const EMPTY_FEED: TeamWorkspaceFeed = { notes: [], messages: [] };

function formatStamp(value: string): string {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function DockTeamView({
  initialTab = 'messages',
  initialFeed
}: {
  initialTab?: TeamTab;
  initialFeed?: TeamWorkspaceFeed;
}): React.JSX.Element {
  const { teamTab, notesFocus, setNotesFocus } = useDashboardDock();
  const { teamMembers, currentUserId } = useDockNotifications();
  const [tab, setTab] = React.useState<TeamTab>(teamTab ?? initialTab);
  const [feed, setFeed] = React.useState<TeamWorkspaceFeed>(
    () => initialFeed ?? EMPTY_FEED
  );
  const [draft, setDraft] = React.useState('');
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (teamTab) setTab(teamTab);
  }, [teamTab]);

  const { execute: loadFeed, isExecuting: loading } = useAction(
    loadTeamWorkspaceFeed,
    {
      onSuccess: ({ data }) => {
        if (!data) return;
        setFeed(data);
      }
    }
  );

  const { execute: sendMessage, isExecuting: sending } = useAction(
    sendTeamMessageAction,
    {
      onSuccess: ({ data }) => {
        if (!data) return;
        setFeed((current) => ({
          ...current,
          messages: [...current.messages, data]
        }));
        setDraft('');
        setAttachments([]);
      },
      onError: ({ error }) =>
        toast.error(error.serverError || 'Could not send message')
    }
  );

  React.useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  React.useEffect(() => {
    if (tab !== 'messages') return;
    const node = scrollerRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [tab, feed.messages.length]);

  const addFiles = React.useCallback((files: File[]): void => {
    if (files.length === 0) return;
    setAttachments((current) => {
      const next = [...current];
      for (const file of files) {
        if (next.length >= CHAT_ATTACHMENT_MAX_COUNT) {
          toast.error(
            `You can attach up to ${CHAT_ATTACHMENT_MAX_COUNT} files`
          );
          break;
        }
        if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
          toast.error(
            `${file.name} is larger than ${Math.round(CHAT_ATTACHMENT_MAX_BYTES / 1024)}KB`
          );
          continue;
        }
        next.push(file);
      }
      return next;
    });
  }, []);

  const submit = (): void => {
    if (sending) return;
    const text = draft;
    const files = attachments;
    if (!text.trim() && files.length === 0) return;
    void (async () => {
      const encoded =
        files.length > 0 ? await encodeChatAttachments(files) : [];
      sendMessage({ body: text, attachments: encoded });
    })();
  };

  const canSend =
    !sending && (draft.trim().length > 0 || attachments.length > 0);

  const members = teamMembers.map((member) => ({
    id: member.id,
    name: member.name,
    image: member.image
  }));
  const memberById = React.useMemo(
    () => new Map(teamMembers.map((member) => [member.id, member])),
    [teamMembers]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 border-b border-border/50 px-3 py-2">
        <TabButton
          active={tab === 'notes'}
          icon={FileTextIcon}
          label="Notes"
          onClick={() => setTab('notes')}
        />
        <TabButton
          active={tab === 'messages'}
          icon={MessageCircleIcon}
          label="Messages"
          onClick={() => setTab('messages')}
        />
      </div>

      {tab === 'notes' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && feed.notes.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">Loading notes…</p>
          ) : (
            <TeamNotesFeed
              notes={feed.notes}
              members={members}
              focus={notesFocus}
              onNoteSent={(note, threadId, subject) => {
                setFeed((current) => ({
                  ...current,
                  notes: [
                    {
                      ...note,
                      threadId,
                      subject
                    },
                    ...current.notes.filter((item) => item.id !== note.id)
                  ]
                }));
              }}
              onNotesDeleted={(threadId) => {
                setFeed((current) => ({
                  ...current,
                  notes: current.notes.filter(
                    (note) => note.threadId !== threadId
                  )
                }));
                if (notesFocus?.threadId === threadId) {
                  setNotesFocus(null);
                }
              }}
            />
          )}
        </div>
      ) : (
        <>
          <div
            ref={scrollerRef}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {loading && feed.messages.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">
                Loading messages…
              </p>
            ) : feed.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center p-5">
                <FeatureIntroEmpty
                  compact
                  icon={<MessageCircleIcon strokeWidth={1.25} />}
                  title="No messages yet"
                  description="Visible to the whole team. @mention someone to notify them."
                />
              </div>
            ) : (
              <ul className="space-y-3 p-3">
                {feed.messages.map((message) => {
                  const member = memberById.get(message.authorId);
                  return (
                    <TeamMessageRow
                      key={message.id}
                      item={message}
                      members={members}
                      image={member?.image ?? null}
                      mine={message.authorId === currentUserId}
                    />
                  );
                })}
              </ul>
            )}
          </div>
          <div className="shrink-0 border-t border-border/50 p-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
              className="flex flex-col gap-1.5 rounded-[20px] border border-border/60 bg-background px-2 py-1.5 transition-colors focus-within:border-border"
            >
              {attachments.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 px-1 pt-0.5">
                  {attachments.map((file, index) => (
                    <ComposerAttachmentChip
                      key={`${file.name}-${file.size}-${index}`}
                      file={file}
                      onRemove={() => {
                        setAttachments((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index)
                        );
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <div className="flex items-end gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Add attachments"
                      disabled={sending}
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-px flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-opacity hover:text-foreground disabled:opacity-30"
                    >
                      <Paperclip className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Add attachments</TooltipContent>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.md"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = event.target.files;
                    if (files && files.length > 0) {
                      addFiles(Array.from(files));
                    }
                    event.target.value = '';
                  }}
                />
                <MentionComposer
                  value={draft}
                  onChange={setDraft}
                  members={members}
                  placeholder="Message the team…"
                  variant="bare"
                  disabled={sending}
                  onSubmit={submit}
                  onPasteImages={addFiles}
                />
                <ChatPlainSendButton
                  disabled={!canSend}
                  className="mb-px text-foreground hover:bg-foreground/5"
                />
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  icon: typeof FileTextIcon;
  label: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg font-mono text-[11px] normal-case tracking-normal transition-colors',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function TeamNotesFeed({
  notes,
  members,
  focus,
  onNoteSent,
  onNotesDeleted
}: {
  notes: TeamNoteItem[];
  members: Array<{ id: string; name: string }>;
  focus: {
    threadId: string;
    subject?: string | null;
    sharedNoteDraft?: string | null;
  } | null;
  onNoteSent: (
    note: {
      id: string;
      body: string;
      authorId: string;
      authorName: string;
      createdAt: string;
    },
    threadId: string,
    subject: string
  ) => void;
  onNotesDeleted: (threadId: string) => void;
}): React.JSX.Element {
  const groups = React.useMemo(() => {
    const byThread = new Map<
      string,
      { threadId: string; subject: string; notes: TeamNoteItem[] }
    >();
    for (const note of notes) {
      const current = byThread.get(note.threadId);
      if (current) {
        current.notes.push(note);
      } else {
        byThread.set(note.threadId, {
          threadId: note.threadId,
          subject: note.subject,
          notes: [note]
        });
      }
    }
    if (focus) {
      const subject = focus.subject?.trim() || '(no subject)';
      const current = byThread.get(focus.threadId);
      if (current) {
        current.subject =
          subject === '(no subject)' ? current.subject : subject;
      } else {
        byThread.set(focus.threadId, {
          threadId: focus.threadId,
          subject,
          notes: []
        });
      }
    }
    const ordered = [...byThread.values()];
    if (focus) {
      const index = ordered.findIndex(
        (group) => group.threadId === focus.threadId
      );
      if (index > 0) {
        const [focused] = ordered.splice(index, 1);
        ordered.unshift(focused);
      }
    }
    return ordered;
  }, [focus, notes]);

  const [openIds, setOpenIds] = React.useState<Set<string>>(
    () => new Set(focus?.threadId ? [focus.threadId] : [])
  );
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { execute: deleteNotes } = useAction(deleteMailThreadNotesAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setDeletingId(null);
      onNotesDeleted(data.threadId);
      setOpenIds((current) => {
        if (!current.has(data.threadId)) return current;
        const next = new Set(current);
        next.delete(data.threadId);
        return next;
      });
    },
    onError: ({ error }) => {
      setDeletingId(null);
      toast.error(error.serverError || 'Could not delete notes');
    }
  });

  React.useEffect(() => {
    if (!focus?.threadId) return;
    setOpenIds((current) => {
      if (current.has(focus.threadId)) return current;
      const next = new Set(current);
      next.add(focus.threadId);
      return next;
    });
  }, [focus?.threadId]);

  if (groups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-5">
        <FeatureIntroEmpty
          compact
          icon={<FileTextIcon strokeWidth={1.25} />}
          title="No notes yet"
          description="Open a mail thread and add a note. It stays under that subject here."
        />
      </div>
    );
  }

  return (
    <ul className="space-y-1 p-2">
      {groups.map((group) => {
        const open = openIds.has(group.threadId);
        return (
          <li
            key={group.threadId}
            className="rounded-lg"
          >
            <div className="flex w-full items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => {
                  setOpenIds((current) => {
                    const next = new Set(current);
                    if (next.has(group.threadId)) next.delete(group.threadId);
                    else next.add(group.threadId);
                    return next;
                  });
                }}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronDownIcon
                  className={cn(
                    'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                    open ? 'rotate-0' : '-rotate-90'
                  )}
                />
                <span className="min-w-0 flex-1 truncate font-fellix text-sm">
                  {group.subject}
                </span>
              </button>
              {group.notes.length > 0 ? (
                <div className="group/count relative flex size-5 shrink-0 items-center justify-center">
                  <span className="pointer-events-none font-mono text-[10px] text-muted-foreground transition-opacity group-hover/count:opacity-0 group-focus-within/count:opacity-0">
                    {group.notes.length}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete notes for ${group.subject}`}
                    disabled={deletingId === group.threadId}
                    className={cn(
                      'absolute inset-0 flex items-center justify-center text-muted-foreground transition-opacity hover:text-destructive',
                      'opacity-0 group-hover/count:opacity-100 group-focus-within/count:opacity-100',
                      deletingId === group.threadId && 'opacity-100'
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDeletingId(group.threadId);
                      deleteNotes({ threadId: group.threadId });
                    }}
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="px-2 pb-3 pt-1">
                  <MailThreadNotesPanel
                    threadId={group.threadId}
                    notes={group.notes
                      .toSorted((a, b) =>
                        a.createdAt.localeCompare(b.createdAt)
                      )
                      .map((note) => ({
                        id: note.id,
                        body: note.body,
                        authorId: note.authorId,
                        authorName: note.authorName,
                        createdAt: note.createdAt
                      }))}
                    sharedNoteDraft={
                      focus?.threadId === group.threadId
                        ? (focus.sharedNoteDraft ?? null)
                        : null
                    }
                    members={members}
                    inline
                    onNoteSent={(note) =>
                      onNoteSent(note, group.threadId, group.subject)
                    }
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TeamMessageRow({
  item,
  members,
  image,
  mine
}: {
  item: TeamMessageItem;
  members: Array<{ id: string; name: string }>;
  image: string | null;
  mine: boolean;
}): React.JSX.Element {
  const accent = useMemberAccentColor(item.authorId || item.authorName, image);

  return (
    <li
      className={cn(
        'flex items-end gap-2',
        mine ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar
        className="size-6 rounded-full"
        style={{ backgroundColor: accent }}
      >
        {image ? (
          <AvatarImage
            src={image}
            alt=""
          />
        ) : null}
        <AvatarFallback
          className="rounded-full text-[9px] font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          {getInitials(item.authorName)}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2',
          mine ? 'rounded-br-md' : 'rounded-bl-md'
        )}
        style={{
          backgroundColor: `color-mix(in srgb, ${accent} ${mine ? '22%' : '16%'}, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`
        }}
      >
        <p className="text-[11px] text-muted-foreground">
          <span style={{ color: accent }}>{item.authorName}</span>
          <span className="text-muted-foreground/70">
            {' '}
            · {formatStamp(item.createdAt)}
          </span>
        </p>
        {item.body.trim() ? (
          <p className="mt-0.5 text-sm">
            <MentionBody
              body={item.body}
              members={members}
            />
          </p>
        ) : null}
        {(item.attachments ?? []).length > 0 ? (
          <div className={cn('space-y-1.5', item.body.trim() && 'mt-1.5')}>
            {(item.attachments ?? []).map((attachment) => (
              <MessageAttachment
                key={`${item.id}-${attachment.name}`}
                attachment={attachment}
              />
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function ComposerAttachmentChip({
  file,
  onRemove
}: {
  file: File;
  onRemove: () => void;
}): React.JSX.Element {
  const previewUrl = React.useMemo(
    () => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file]
  );
  React.useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className="size-4 rounded-[3px] object-cover"
        />
      ) : (
        <Paperclip className="size-3 shrink-0" />
      )}
      <span className="max-w-[120px] truncate">{file.name}</span>
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="rounded-sm hover:text-foreground"
      >
        <XIcon className="size-3" />
      </button>
    </span>
  );
}

function MessageAttachment({
  attachment
}: {
  attachment: TeamMessageAttachment;
}): React.JSX.Element {
  const href = teamAttachmentHref(attachment);
  if (attachment.kind === 'image') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <img
          src={href}
          alt={attachment.name}
          className="max-h-40 max-w-full rounded-lg object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={href}
      download={attachment.name}
      className="inline-flex max-w-full items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
    >
      <Paperclip className="size-3 shrink-0" />
      <span className="truncate">{attachment.name}</span>
    </a>
  );
}
