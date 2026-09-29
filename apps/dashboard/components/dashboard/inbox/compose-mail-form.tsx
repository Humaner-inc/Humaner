'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { encodeChatAttachments } from '@humaner/shared/chat-attachments';
import { Paperclip } from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { composeMail } from '@/actions/inbox/compose-mail';
import { replyMailThread } from '@/actions/inbox/reply-mail-thread';
import { saveMailDraft } from '@/actions/inbox/save-mail-draft';
import { MailComposeBodyEditor } from '@/components/dashboard/inbox/mail-compose-body-editor';
import {
  QUICK_CREATE_BODY_CLASS,
  QUICK_CREATE_CHIP_CLASS,
  QUICK_CREATE_META_CLASS,
  QUICK_CREATE_TITLE_CLASS
} from '@/components/dashboard/quick-create-dialog';
import { Button } from '@/components/ui/button';
import { SaveIcon } from '@/components/ui/save-icon';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SendIcon, type SendIconHandle } from '@/components/ui/send-icon';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { composeDraftHasContent } from '@/lib/inbox/compose-draft';
import {
  chatAttachmentsToMailAttachments,
  MAIL_ATTACHMENT_MAX_COUNT,
  type MailAttachment
} from '@/lib/inbox/mail-attachments';
import { groupMailInboxes } from '@/lib/inbox/mail-inbox-groups';
import { cn } from '@/lib/utils';

const COMPOSE_FIELD_CLASS =
  'w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm shadow-none outline-none ring-0 placeholder:text-muted-foreground/60 focus-visible:border-foreground focus-visible:ring-0';

export type ComposeMailFormValues = {
  aliasId: string;
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  draftThreadId?: string;
};

export function ComposeMailForm({
  inboxes,
  defaultAliasId = null,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  initialAttachments,
  threadId,
  initialDraftThreadId,
  confirmClose = false,
  layout = 'default',
  onSent,
  onCancel,
  onDraft,
  onDirtyChange,
  className
}: {
  inboxes: MailInboxOption[];
  defaultAliasId?: string | null;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  initialAttachments?: MailAttachment[];
  threadId?: string;
  initialDraftThreadId?: string;
  confirmClose?: boolean;
  layout?: 'default' | 'quick';
  onSent?: () => void;
  onCancel?: () => void;
  onDraft?: (values: ComposeMailFormValues) => void;
  onDirtyChange?: (dirty: boolean) => void;
  className?: string;
}): React.JSX.Element {
  const router = useRouter();
  const sendIconRef = React.useRef<SendIconHandle>(null);
  const [aliasId, setAliasId] = React.useState(
    () => defaultAliasId ?? inboxes[0]?.id ?? ''
  );
  const [to, setTo] = React.useState(initialTo);
  const [subject, setSubject] = React.useState(initialSubject);
  const [body, setBody] = React.useState(initialBody);
  const [bodyHtml, setBodyHtml] = React.useState<string | null>(null);
  const [draftThreadId, setDraftThreadId] = React.useState(
    initialDraftThreadId ?? ''
  );
  const [attachments, setAttachments] = React.useState<MailAttachment[]>(
    () => initialAttachments ?? []
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!defaultAliasId) return;
    setAliasId(defaultAliasId);
  }, [defaultAliasId]);

  React.useEffect(() => {
    setTo(initialTo);
    setSubject(initialSubject);
    setBody(initialBody);
    setBodyHtml(null);
    setDraftThreadId(initialDraftThreadId ?? '');
  }, [initialTo, initialSubject, initialBody, initialDraftThreadId]);

  React.useEffect(() => {
    setAttachments(initialAttachments ?? []);
  }, [initialAttachments]);

  const dirty =
    to !== initialTo ||
    subject !== initialSubject ||
    body !== initialBody ||
    attachments.length !== (initialAttachments?.length ?? 0) ||
    (defaultAliasId != null && aliasId !== defaultAliasId);

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const finishSend = (): void => {
    sendIconRef.current?.stopAnimation();
    onSent?.();
    router.refresh();
  };

  const { execute: executeCompose, isExecuting: isComposing } = useAction(
    composeMail,
    {
      onSuccess: () => {
        toast.success('Email sent');
        finishSend();
      },
      onError: ({ error }) => {
        sendIconRef.current?.stopAnimation();
        toast.error(error.serverError || 'Could not send email');
      }
    }
  );

  const { execute: executeReply, isExecuting: isReplying } = useAction(
    replyMailThread,
    {
      onSuccess: () => {
        toast.success('Reply sent');
        finishSend();
      },
      onError: ({ error }) => {
        sendIconRef.current?.stopAnimation();
        toast.error(error.serverError || 'Could not send reply');
      }
    }
  );

  const { execute: executeSaveDraft, isExecuting: isSavingDraft } = useAction(
    saveMailDraft,
    {
      onSuccess: ({ data }) => {
        if (data?.threadId) {
          setDraftThreadId(data.threadId);
        }
        toast.success('Draft saved');
        onDraft?.({
          aliasId,
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
          ...(threadId ? { threadId } : {}),
          ...(data?.threadId ? { draftThreadId: data.threadId } : {})
        });
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not save draft');
      }
    }
  );

  const isExecuting = isComposing || isReplying || isSavingDraft;
  const mailboxGroups = React.useMemo(
    () => groupMailInboxes(inboxes),
    [inboxes]
  );
  const selectedInbox = inboxes.find((inbox) => inbox.id === aliasId);
  const fromLabel = selectedInbox
    ? selectedInbox.displayName
      ? `${selectedInbox.displayName} <${selectedInbox.address}>`
      : selectedInbox.address
    : null;

  const values: ComposeMailFormValues = {
    aliasId,
    to: to.trim(),
    subject: subject.trim(),
    body: body.trim(),
    ...(threadId ? { threadId } : {}),
    ...(draftThreadId ? { draftThreadId } : {})
  };

  const canSend = threadId
    ? Boolean(values.body) && !isExecuting
    : Boolean(aliasId) &&
      values.to.length > 0 &&
      values.subject.length > 0 &&
      values.body.length > 0 &&
      !isExecuting;

  const handleSend = (): void => {
    if (!canSend) return;
    sendIconRef.current?.startAnimation();
    if (threadId) {
      executeReply({
        threadId,
        ...(aliasId ? { aliasId } : {}),
        body: values.body,
        ...(bodyHtml ? { bodyHtml } : {}),
        ...(attachments.length > 0 ? { attachments } : {})
      });
      return;
    }
    executeCompose({
      aliasId,
      to: values.to,
      subject: values.subject,
      body: values.body,
      ...(bodyHtml ? { bodyHtml } : {}),
      ...(attachments.length > 0 ? { attachments } : {}),
      ...(draftThreadId ? { draftThreadId } : {})
    });
  };

  const handleAttachFiles = async (files: File[]): Promise<void> => {
    if (files.length === 0) return;
    const encoded = await encodeChatAttachments(files);
    const next = chatAttachmentsToMailAttachments(encoded);
    const skipped = files.length - next.length;
    if (skipped > 0) {
      toast.error(
        `Could not attach ${skipped} file${skipped === 1 ? '' : 's'} — use images, PDFs, or text under 600KB.`
      );
    }
    if (next.length === 0) return;
    setAttachments((current) =>
      [...current, ...next].slice(0, MAIL_ATTACHMENT_MAX_COUNT)
    );
  };

  const handleDraft = (): void => {
    if (!composeDraftHasContent(values)) {
      onDraft?.(values);
      return;
    }
    if (!aliasId) {
      toast.error('Connect a mailbox to save a draft');
      return;
    }
    executeSaveDraft({
      aliasId,
      to: values.to,
      subject: values.subject,
      body: values.body,
      ...(bodyHtml ? { bodyHtml } : {}),
      ...(draftThreadId ? { draftThreadId } : {})
    });
  };

  const isQuick = layout === 'quick';

  return (
    <form
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        isQuick ? 'gap-0' : 'gap-3',
        className
      )}
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          isQuick ? 'gap-1 px-5 pt-4' : 'gap-3'
        )}
      >
        <input
          id="compose-to"
          type="email"
          autoComplete="email"
          placeholder="To"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          disabled={isExecuting}
          className={
            isQuick
              ? cn(QUICK_CREATE_META_CLASS, 'py-1.5')
              : COMPOSE_FIELD_CLASS
          }
        />
        <input
          id="compose-subject"
          placeholder="Subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          disabled={isExecuting}
          className={
            isQuick ? cn(QUICK_CREATE_TITLE_CLASS, 'py-1') : COMPOSE_FIELD_CLASS
          }
        />
        <MailComposeBodyEditor
          value={body}
          onChange={(next) => {
            setBody(next.text);
            setBodyHtml(next.html);
          }}
          disabled={isExecuting}
          placeholder="Write the message…"
          className={isQuick ? 'min-h-32 flex-1' : 'min-h-32 flex-1'}
          contentClassName={
            isQuick ? cn(QUICK_CREATE_BODY_CLASS, 'min-h-32') : undefined
          }
        />
        {attachments.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {attachments.map((attachment, index) => (
              <span
                key={`${attachment.name}-${index}`}
                className="inline-flex h-7 max-w-56 items-center gap-1.5 rounded-lg border border-border/60 px-2 font-mono text-[11px] text-muted-foreground"
              >
                <Paperclip className="size-3 shrink-0" />
                <span className="min-w-0 truncate">{attachment.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${attachment.name}`}
                  className="shrink-0 text-muted-foreground/70 transition-colors hover:text-foreground"
                  disabled={isExecuting}
                  onClick={() =>
                    setAttachments((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3',
          isQuick && 'px-5 pb-4 pt-3'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.csv,.json,.log"
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = '';
              void handleAttachFiles(files);
            }}
          />
          <button
            type="button"
            aria-label="Attach files"
            title="Attach files"
            disabled={
              isExecuting || attachments.length >= MAIL_ATTACHMENT_MAX_COUNT
            }
            onClick={() => fileInputRef.current?.click()}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Paperclip className="size-3.5" />
          </button>
          {inboxes.length > 1 ? (
            <Select
              value={aliasId}
              onValueChange={setAliasId}
              disabled={inboxes.length === 0 || isExecuting}
            >
              <SelectTrigger
                id="compose-from"
                className={
                  isQuick
                    ? cn(
                        QUICK_CREATE_CHIP_CLASS,
                        'w-auto max-w-full shadow-none focus:ring-0 [&>svg]:size-3.5'
                      )
                    : 'h-8 w-auto max-w-full border-0 bg-transparent px-0 font-mono text-[11px] text-muted-foreground shadow-none focus:ring-0'
                }
              >
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent>
                {mailboxGroups.map((mailbox) => (
                  <SelectGroup key={mailbox.connectionId}>
                    <SelectLabel className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {mailbox.providerName} · {mailbox.email}
                    </SelectLabel>
                    {mailbox.aliases.map((inbox) => (
                      <SelectItem
                        key={inbox.id}
                        value={inbox.id}
                      >
                        {inbox.displayName
                          ? `${inbox.displayName} <${inbox.address}>`
                          : inbox.address}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {fromLabel ? `From ${fromLabel}` : 'Connect a mailbox to send'}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onDraft ? (
            <Button
              type="button"
              variant={confirmClose ? 'default' : 'outline'}
              size="sm"
              className="h-8 px-3 font-mono"
              disabled={isExecuting}
              onClick={handleDraft}
            >
              <span className="inline-flex items-center gap-2">
                <SaveIcon size={15} />
                {isSavingDraft ? 'Saving…' : 'Draft'}
              </span>
            </Button>
          ) : null}
          {onCancel && (confirmClose || !onDraft) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 font-mono"
              disabled={isExecuting}
              onClick={onCancel}
            >
              {confirmClose ? 'Discard' : 'Cancel'}
            </Button>
          ) : null}
          <Button
            type="submit"
            size="sm"
            className="h-8 min-w-[6.5rem] px-3 font-mono"
            disabled={!canSend}
          >
            <span className="inline-flex items-center gap-2">
              <SendIcon
                ref={sendIconRef}
                size={16}
              />
              {isExecuting ? 'Sending…' : 'Send'}
            </span>
          </Button>
        </div>
      </div>
      {confirmClose ? (
        <p
          className={cn(
            'font-mono text-[11px] text-muted-foreground',
            isQuick && 'px-5 pb-3'
          )}
        >
          Save this as a draft or discard it.
        </p>
      ) : null}
    </form>
  );
}
