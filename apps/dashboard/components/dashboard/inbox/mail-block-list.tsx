'use client';

import * as React from 'react';
import { BanIcon } from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import {
  blockMailSender,
  unblockMailSender
} from '@/actions/inbox/manage-blocked-senders';
import { BlockMailSenderDialog } from '@/components/dashboard/inbox/block-mail-sender-dialog';
import {
  InboxSettingsGroupCard,
  InboxSettingsGroupRow
} from '@/components/dashboard/inbox/inbox-settings-group-card';
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
    <InboxSettingsGroupCard
      className="border-orange-400/35"
      title="Blocked senders"
      subtitle="New mail from these addresses goes to Spam."
      titleClassName="text-orange-700 dark:text-orange-300"
      subtitleClassName="text-orange-700/70 dark:text-orange-300/70"
      headerClassName="border-orange-400/25 bg-orange-500/10 dark:bg-orange-500/10"
      headerIcon={
        <BanIcon
          className="size-5 shrink-0 text-orange-600 dark:text-orange-400"
          aria-hidden
        />
      }
    >
      {canManage ? (
        <InboxSettingsGroupRow>
          <form
            className="flex gap-2"
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
        </InboxSettingsGroupRow>
      ) : null}
      {rows.length === 0 ? (
        <InboxSettingsGroupRow>
          <p className="text-sm text-muted-foreground">
            No blocked senders yet.
          </p>
        </InboxSettingsGroupRow>
      ) : (
        rows.map((row) => (
          <InboxSettingsGroupRow key={row.email}>
            <div className="flex items-center justify-between gap-3">
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
            </div>
          </InboxSettingsGroupRow>
        ))
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
    </InboxSettingsGroupCard>
  );
}
