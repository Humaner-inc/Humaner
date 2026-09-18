'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { composeMail } from '@/actions/inbox/compose-mail';
import { replyMailThread } from '@/actions/inbox/reply-mail-thread';
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
};

export function ComposeMailForm({
  inboxes,
  defaultAliasId = null,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  threadId,
  confirmClose = false,
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
  threadId?: string;
  confirmClose?: boolean;
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

  React.useEffect(() => {
    if (!defaultAliasId) return;
    setAliasId(defaultAliasId);
  }, [defaultAliasId]);

  React.useEffect(() => {
    setTo(initialTo);
    setSubject(initialSubject);
    setBody(initialBody);
  }, [initialTo, initialSubject, initialBody]);

  const dirty =
    to !== initialTo ||
    subject !== initialSubject ||
    body !== initialBody ||
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

  const isExecuting = isComposing || isReplying;
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
    ...(threadId ? { threadId } : {})
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
        body: values.body
      });
      return;
    }
    executeCompose({
      aliasId,
      to: values.to,
      subject: values.subject,
      body: values.body
    });
  };

  const handleDraft = (): void => {
    onDraft?.(values);
  };

  return (
    <form
      className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <input
        id="compose-to"
        type="email"
        autoComplete="email"
        placeholder="To"
        value={to}
        onChange={(event) => setTo(event.target.value)}
        disabled={isExecuting}
        className={COMPOSE_FIELD_CLASS}
      />
      <input
        id="compose-subject"
        placeholder="Subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        disabled={isExecuting}
        className={COMPOSE_FIELD_CLASS}
      />
      <textarea
        id="compose-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={isExecuting}
        placeholder="Write the message…"
        className="min-h-32 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {inboxes.length > 1 ? (
            <Select
              value={aliasId}
              onValueChange={setAliasId}
              disabled={inboxes.length === 0 || isExecuting}
            >
              <SelectTrigger
                id="compose-from"
                className="h-8 w-auto max-w-full border-0 bg-transparent px-0 font-mono text-[11px] text-muted-foreground shadow-none focus:ring-0"
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
              className="h-9 px-4 font-mono"
              disabled={isExecuting}
              onClick={handleDraft}
            >
              <span className="inline-flex items-center gap-2">
                <SaveIcon size={15} />
                Draft
              </span>
            </Button>
          ) : null}
          {onCancel && (confirmClose || !onDraft) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-4 font-mono"
              disabled={isExecuting}
              onClick={onCancel}
            >
              {confirmClose ? 'Discard' : 'Cancel'}
            </Button>
          ) : null}
          <Button
            type="submit"
            size="sm"
            className="h-9 min-w-[7.5rem] px-4 font-mono"
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
        <p className="font-mono text-[11px] text-muted-foreground">
          Save this as a draft or discard it.
        </p>
      ) : null}
    </form>
  );
}
