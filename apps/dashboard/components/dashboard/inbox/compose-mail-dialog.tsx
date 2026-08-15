'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { composeMail } from '@/actions/inbox/compose-mail';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { groupMailInboxes } from '@/lib/inbox/mail-inbox-groups';

export function ComposeMailDialog({
  open,
  onOpenChange,
  inboxes,
  defaultAliasId = null
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxes: MailInboxOption[];
  defaultAliasId?: string | null;
}): React.JSX.Element {
  const router = useRouter();
  const sendIconRef = React.useRef<SendIconHandle>(null);
  const [aliasId, setAliasId] = React.useState(
    () => defaultAliasId ?? inboxes[0]?.id ?? ''
  );
  const [to, setTo] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setAliasId(defaultAliasId ?? inboxes[0]?.id ?? '');
    setTo('');
    setSubject('');
    setBody('');
  }, [open, defaultAliasId, inboxes]);

  const { execute, isExecuting } = useAction(composeMail, {
    onSuccess: () => {
      toast.success('Email sent');
      sendIconRef.current?.stopAnimation();
      onOpenChange(false);
      router.refresh();
    },
    onError: ({ error }) => {
      sendIconRef.current?.stopAnimation();
      toast.error(error.serverError || 'Could not send email');
    }
  });

  const mailboxGroups = React.useMemo(
    () => groupMailInboxes(inboxes),
    [inboxes]
  );

  const canSend =
    Boolean(aliasId) &&
    to.trim().length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    !isExecuting;

  const handleSend = (): void => {
    if (!canSend) return;
    sendIconRef.current?.startAnimation();
    execute({
      aliasId,
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim()
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="gap-0 rounded-none p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="font-display text-xl font-semibold tracking-tight">
            Compose
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="compose-from"
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              From
            </Label>
            <Select
              value={aliasId}
              onValueChange={setAliasId}
              disabled={inboxes.length === 0 || isExecuting}
            >
              <SelectTrigger
                id="compose-from"
                className="h-9 rounded-none"
              >
                <SelectValue placeholder="Select alias" />
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
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="compose-to"
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              To
            </Label>
            <Input
              id="compose-to"
              type="email"
              autoComplete="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              disabled={isExecuting}
              className="h-9 rounded-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="compose-subject"
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Subject
            </Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={isExecuting}
              placeholder="Subject"
              className="h-9 rounded-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="compose-body"
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Message
            </Label>
            <Textarea
              id="compose-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={isExecuting}
              placeholder="Write your message…"
              rows={8}
              className="min-h-40 resize-y rounded-none"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border px-5 py-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-none px-4 font-mono"
            disabled={isExecuting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 min-w-[7.5rem] rounded-none px-4 font-mono"
            disabled={!canSend}
            onClick={handleSend}
          >
            <span className="inline-flex items-center gap-2">
              <SendIcon
                ref={sendIconRef}
                size={16}
              />
              {isExecuting ? 'Sending…' : 'Send'}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
