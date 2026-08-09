'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  StarIcon,
  Trash2Icon,
  UserPlus2Icon
} from '@humaner/shared/icons';
import { format } from 'date-fns';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import {
  applyMailThreadTag,
  archiveMailThread,
  assignMailThread,
  deleteMailThread,
  markMailThreadRead
} from '@/actions/inbox/manage-mail-thread';
import { replyMailThread } from '@/actions/inbox/reply-mail-thread';
import { suggestMailThreadReplies } from '@/actions/inbox/suggest-mail-replies';
import {
  DeleteMailThreadsDialog,
  readSkipDeleteWarning,
  requestMailDelete
} from '@/components/dashboard/inbox/delete-mail-threads-dialog';
import { MailMessageBody } from '@/components/dashboard/inbox/mail-message-body';
import { MAIL_SPLIT_ROW_HEIGHT_CLASS } from '@/components/dashboard/inbox/mail-split-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SendIcon, type SendIconHandle } from '@/components/ui/send-icon';
import { SkillzCubeLoader } from '@/components/ui/skillz-cube-loader';
import { mailStatusToGlyph, StatusGlyph } from '@/components/ui/status-glyph';
import { Textarea } from '@/components/ui/textarea';
import { Routes } from '@/constants/routes';
import type {
  MailTagItem,
  MailThreadDetail as MailThreadDetailDto
} from '@/data/inbox/get-mail-threads';
import { useOnboardingSound } from '@/hooks/use-onboarding-sound';
import { isRichMailHtml } from '@/lib/inbox/mail-body-display';
import { tagsForAlias } from '@/lib/inbox/mail-tag-scope';
import { getLogoUrl } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

type Suggestion = { label: string; draft: string };
type SendPhase = 'idle' | 'sending' | 'success';

const accentBorder =
  'border-[color-mix(in_srgb,var(--accent-color,#0682de)_55%,transparent)]';
const accentSoftBg =
  'bg-[color-mix(in_srgb,var(--accent-color,#0682de)_10%,transparent)]';

function shouldAutoSuggest(thread: MailThreadDetailDto): boolean {
  if (!thread.isUnread) return false;
  const last = thread.messages[thread.messages.length - 1];
  return last?.direction === 'INBOUND';
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
  members?: Array<{ id: string; name: string }>;
  /** When true, fills a reading pane and skips leave-list navigation. */
  embedded?: boolean;
  onClosed?: () => void;
  /** Instantly remove from the list (delete / archive out of view). */
  onRemoved?: () => void;
  onPatched?: (patch: {
    tag?: MailTagItem | null;
    isUnread?: boolean;
    assigneeId?: string | null;
  }) => void;
}): React.JSX.Element {
  const router = useRouter();
  const { play } = useOnboardingSound();
  const [thread, setThread] = React.useState(threadProp);
  React.useEffect(() => {
    setThread(threadProp);
  }, [threadProp]);

  const applicableTags = tagsForAlias(tags, thread.aliasId);
  const sendIconRef = React.useRef<SendIconHandle>(null);
  const successTimerRef = React.useRef<number | null>(null);
  const [body, setBody] = React.useState('');
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [suggesting, setSuggesting] = React.useState(() =>
    shouldAutoSuggest(threadProp)
  );
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [sendPhase, setSendPhase] = React.useState<SendPhase>('idle');
  const markedReadRef = React.useRef(false);
  const isArchived = Boolean(thread.archivedAt);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [skipDeleteWarning, setSkipDeleteWarning] = React.useState(false);

  React.useEffect(() => {
    setSkipDeleteWarning(readSkipDeleteWarning());
  }, []);

  const leaveOrClose = React.useCallback(() => {
    if (embedded) {
      onClosed?.();
      router.refresh();
      return;
    }
    router.push(Routes.InboxAll);
    router.refresh();
  }, [embedded, onClosed, router]);

  const removeAndClose = React.useCallback(() => {
    onRemoved?.();
    leaveOrClose();
  }, [leaveOrClose, onRemoved]);

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

  const { execute: markRead } = useAction(markMailThreadRead, {
    onSuccess: () => router.refresh()
  });

  const { execute: runArchive } = useAction(archiveMailThread, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not archive')
  });

  const { execute: runDelete } = useAction(deleteMailThread, {
    onSuccess: () => router.refresh(),
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

  const handleDelete = (): void => {
    removeAndClose();
    toast.success('Deleted 1');
    runDelete({ threadId: thread.id });
  };

  const handleAssign = (assigneeId: string | null): void => {
    setThread((current) => ({ ...current, assigneeId }));
    onPatched?.({ assigneeId });
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
    setSuggesting(shouldAutoSuggest(thread));
    setSuggestions([]);
    setSelectedIndex(null);
    setComposerOpen(false);
    setBody('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id]);

  React.useEffect(() => {
    if (!thread.isUnread || markedReadRef.current) return;
    markedReadRef.current = true;
    onPatched?.({ isUnread: false });
    markRead({ threadId: thread.id, isUnread: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id]);

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

  const latestInbound = [...thread.messages]
    .reverse()
    .find((message) => message.direction === 'INBOUND');
  const firstInbound = thread.messages.find(
    (message) => message.direction === 'INBOUND'
  );
  const senderAddress =
    firstInbound?.fromAddress ?? latestInbound?.fromAddress ?? null;
  const senderMatch = senderAddress?.match(/^(.*?)\s*<([^>]+)>$/);
  const senderLabel = (
    senderMatch?.[2]?.trim() ||
    senderMatch?.[1]?.trim() ||
    senderAddress ||
    'Unknown sender'
  ).trim();
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
    setSuggesting(true);
    loadSuggestions({ threadId: thread.id });
  };

  const pickSuggestion = (index: number): void => {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    setSelectedIndex(index);
    setBody(suggestion.draft);
    setComposerOpen(true);
  };

  const handleSend = (): void => {
    if (body.trim().length === 0 || isExecuting || sendPhase !== 'idle') return;
    setSendPhase('sending');
    sendIconRef.current?.startAnimation();
    sendReply({
      threadId: thread.id,
      body
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

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col bg-background',
        embedded ? 'h-full' : 'min-h-[32rem]'
      )}
    >
      <header
        className={cn(
          'flex shrink-0 items-center gap-3 border-b border-border bg-background',
          embedded
            ? cn(MAIL_SPLIT_ROW_HEIGHT_CLASS, 'px-4 sm:px-5')
            : 'px-4 py-3 sm:px-5'
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <StatusGlyph kind={mailStatusToGlyph(thread.status)} />
            <h1
              className={cn(
                'min-w-0 truncate font-fellix font-semibold tracking-tight',
                embedded ? 'text-base leading-5' : 'text-xl sm:text-2xl'
              )}
            >
              {thread.subject || '(no subject)'}
            </h1>
            {thread.tag ? (
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: thread.tag.color }}
                title={thread.tag.name}
                aria-label={thread.tag.name}
              />
            ) : null}
          </div>
          {!embedded ? (
            <p className="mt-1 truncate pl-[1.375rem] text-xs text-muted-foreground">
              {senderLabel}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            title="Reply"
            onClick={openReply}
          >
            <ArrowRightIcon className="size-4 rotate-180" />
            <span className="sr-only">Reply</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            title="Forward"
            onClick={() => {
              toast.message('Forward is coming soon');
            }}
          >
            <ForwardGlyph />
            <span className="sr-only">Forward</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-none"
                title="Assign"
              >
                <UserPlus2Icon className="size-4" />
                <span className="sr-only">Assign</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isArchived ? (
                <DropdownMenuItem onSelect={() => handleArchive(false)}>
                  Move to inbox
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => handleArchive(true)}>
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => handleAssign(null)}>
                Unassigned
              </DropdownMenuItem>
              {members.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  onSelect={() => handleAssign(member.id)}
                >
                  {member.name}
                  {thread.assigneeId === member.id ? ' ✓' : ''}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {applicableTags.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-none"
                  title="Tag color"
                >
                  {thread.tag ? (
                    <span
                      className="size-3.5 rounded-none"
                      style={{ backgroundColor: thread.tag.color }}
                      aria-hidden
                    />
                  ) : (
                    <StarIcon className="size-4" />
                  )}
                  <span className="sr-only">Tag color</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleTag(null)}>
                  No tag
                </DropdownMenuItem>
                {applicableTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onSelect={() => handleTag(tag.id)}
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-none text-destructive hover:text-destructive"
            title="Delete"
            onClick={() => {
              requestMailDelete(
                skipDeleteWarning,
                () => setDeleteOpen(true),
                handleDelete
              );
            }}
          >
            <Trash2Icon className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-5 sm:px-6">
          <ol className="space-y-4">
            {thread.messages.map((message) => {
              const outbound = message.direction === 'OUTBOUND';
              const rich = isRichMailHtml(message.bodyHtml);
              const { name: fromName, email: fromEmail } = parseMailAddress(
                message.fromAddress
              );
              const displayName = fromName || fromEmail;
              const fromDomain = (() => {
                const at = fromEmail.lastIndexOf('@');
                if (at < 0) return null;
                return fromEmail.slice(at + 1).toLowerCase() || null;
              })();

              return (
                <li key={message.id}>
                  <article className="space-y-3">
                    {/* Gmail-style: sender chrome on the reading canvas, not inside the email card */}
                    <div className="flex items-start gap-3 px-0.5">
                      <Avatar className="size-10 shrink-0">
                        {fromDomain ? (
                          <AvatarImage
                            src={getLogoUrl(fromDomain, 64, true)}
                            alt=""
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
                              {fromName ? (
                                <span className="ml-1.5 font-normal text-muted-foreground">
                                  &lt;{fromEmail}&gt;
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              To {message.toAddresses.join(', ')}
                            </p>
                          </div>
                          <time
                            dateTime={message.sentAt}
                            className="shrink-0 pt-0.5 text-xs text-muted-foreground"
                          >
                            {formatMailTimestamp(message.sentAt)}
                          </time>
                        </div>
                      </div>
                    </div>

                    {rich ? (
                      <MailMessageBody
                        bodyHtml={message.bodyHtml}
                        bodyText={message.bodyText}
                        subject={thread.subject}
                        className="mt-0"
                      />
                    ) : (
                      <div
                        className={cn(
                          'bg-background px-5 py-4',
                          outbound && accentSoftBg
                        )}
                      >
                        <MailMessageBody
                          bodyHtml={message.bodyHtml}
                          bodyText={message.bodyText}
                          subject={thread.subject}
                          className="mt-0 px-0.5"
                        />
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>

          {!composerOpen ? (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-none bg-background px-4"
                  onClick={openReply}
                >
                  <ArrowRightIcon className="size-3.5 rotate-180" />
                  Reply
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-none bg-background px-4"
                  onClick={() => {
                    toast.message('Forward is coming soon');
                  }}
                >
                  <ForwardGlyph className="size-3.5" />
                  Forward
                </Button>
              </div>
              {!suggesting ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto h-9 gap-2 rounded-none bg-background px-4"
                  onClick={suggestAgain}
                >
                  <SkillzCubeLoader size={18} />
                  Suggest
                </Button>
              ) : null}
            </div>
          ) : null}

          {suggesting ? (
            <article className="w-full border border-border/50 bg-background px-4 py-3.5 shadow-sm">
              {suggestionsLoading ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <SkillzCubeLoader size={32} />
                    <p className="text-sm text-muted-foreground">
                      Suggesting reply
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-none px-4 font-mono"
                    onClick={discardSuggestions}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <SkillzCubeLoader
                          size={28}
                          filled
                        />
                        <p className="truncate font-fellix text-sm font-medium">
                          Suggested reply
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        To:{' '}
                        <span style={{ color: 'var(--accent-color, #0682de)' }}>
                          {toName}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-none px-4 font-mono"
                        disabled={loadingSuggestions}
                        onClick={suggestAgain}
                      >
                        Suggest again
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-none px-4 font-mono"
                        onClick={discardSuggestions}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {suggestionsReady ? (
                    <ul className="mt-3 space-y-1">
                      {suggestions.map((suggestion, index) => {
                        const active = selectedIndex === index;
                        return (
                          <li key={`${suggestion.label}-${index}`}>
                            <button
                              type="button"
                              onClick={() => pickSuggestion(index)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-none px-1 py-2.5 text-left text-sm transition-colors',
                                active ? accentSoftBg : 'hover:bg-muted/60'
                              )}
                            >
                              <span
                                className={cn(
                                  'flex size-6 shrink-0 items-center justify-center rounded-none font-mono text-[11px]',
                                  active
                                    ? 'text-foreground'
                                    : 'bg-muted text-muted-foreground'
                                )}
                                style={
                                  active
                                    ? {
                                        backgroundColor:
                                          'color-mix(in srgb, var(--accent-color, #0682de) 28%, transparent)'
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
                                    color: 'var(--accent-color, #0682de)'
                                  }}
                                />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </>
              )}
            </article>
          ) : null}

          {composerOpen ? (
            <section
              className={cn(
                'w-full border bg-background px-4 py-3.5 shadow-sm',
                accentBorder,
                accentSoftBg
              )}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-2.5">
                <div>
                  <p className="text-sm font-medium">Reply</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Sends from {thread.aliasAddress}
                  </p>
                </div>
                {!suggesting ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-none px-4 font-mono"
                    onClick={suggestAgain}
                  >
                    Suggest again
                  </Button>
                ) : null}
              </div>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write your reply…"
                rows={6}
                className="min-h-32 resize-y rounded-none bg-background"
              />
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-none px-4 font-mono"
                  disabled={sendPhase !== 'idle'}
                  onClick={() => setComposerOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 min-w-[7.5rem] rounded-none px-4 font-mono"
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
                      <SendIcon
                        ref={sendIconRef}
                        size={16}
                      />
                      {sendPhase === 'idle' ? 'Send' : null}
                    </span>
                  )}
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <DeleteMailThreadsDialog
        open={deleteOpen}
        count={1}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          setSkipDeleteWarning(readSkipDeleteWarning());
          handleDelete();
        }}
      />
    </div>
  );
}
