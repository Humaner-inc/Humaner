'use client';

import * as React from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import {
  blockMailSender,
  unblockMailSender
} from '@/actions/inbox/manage-blocked-senders';
import { BlockMailSenderDialog } from '@/components/dashboard/inbox/block-mail-sender-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BlockedSenderItem } from '@/data/inbox/get-blocked-senders';

export function MailBlockList({
  senders,
  canManage
}: {
  senders: BlockedSenderItem[];
  canManage: boolean;
}): React.JSX.Element {
  const [email, setEmail] = React.useState('');
  const [rows, setRows] = React.useState(senders);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    setRows(senders);
  }, [senders]);

  const { execute: runBlock, isExecuting: blocking } = useAction(
    blockMailSender,
    {
      onSuccess: ({ data }) => {
        const next = data?.email;
        if (next) {
          setRows((current) =>
            current.some((row) => row.email === next)
              ? current
              : [
                  { email: next, createdAt: new Date().toISOString() },
                  ...current
                ]
          );
        }
        setEmail('');
        toast.success(next ? `Blocked ${next}` : 'Sender blocked');
      },
      onError: ({ error }) =>
        toast.error(error.serverError || 'Could not block sender')
    }
  );

  const { execute: runUnblock, isExecuting: unblocking } = useAction(
    unblockMailSender,
    {
      onSuccess: ({ input }) => {
        setRows((current) =>
          current.filter((row) => row.email !== input.email)
        );
        toast.success('Unblocked');
      },
      onError: ({ error }) =>
        toast.error(error.serverError || 'Could not unblock sender')
    }
  );

  return (
    <section className="overflow-hidden rounded-md border">
      <div className="border-b bg-muted px-4 py-2.5">
        <p className="font-mono text-sm font-medium">Blocked senders</p>
        <p className="text-xs text-muted-foreground">
          New mail from these addresses goes to Spam.
        </p>
      </div>
      {canManage ? (
        <form
          className="flex gap-2 border-b px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (email.trim().length === 0) return;
            setConfirmOpen(true);
          }}
        >
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@domain.com"
            type="email"
            className="font-mono text-sm"
            disabled={blocking}
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="font-mono"
            disabled={blocking || email.trim().length === 0}
          >
            Block
          </Button>
        </form>
      ) : null}
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No blocked senders yet.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li
              key={row.email}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <p className="min-w-0 truncate font-mono text-sm">{row.email}</p>
              {canManage ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 font-mono text-[10px]"
                  disabled={unblocking}
                  onClick={() => runUnblock({ email: row.email })}
                >
                  Unblock
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <BlockMailSenderDialog
        open={confirmOpen}
        sender={email.trim()}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false);
          runBlock({ email });
        }}
      />
    </section>
  );
}
