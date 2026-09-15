'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { emptyTrash } from '@/actions/inbox/manage-mail-thread';
import { updateTrashRetention } from '@/actions/inbox/update-trash-retention';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  isMailTrashRetention,
  MAIL_TRASH_RETENTION_OPTIONS,
  type MailTrashRetentionValue
} from '@/lib/inbox/mail-trash-retention';
import { cn } from '@/lib/utils';

export function TrashFolderToolbar({
  retention,
  mailbox = null,
  canEmpty
}: {
  retention: MailTrashRetentionValue;
  mailbox?: string | null;
  canEmpty: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [selected, setSelected] = React.useState(retention);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const { execute: saveRetention, isExecuting: savingRetention } = useAction(
    updateTrashRetention,
    {
      onError: ({ error }) => {
        setSelected(retention);
        toast.error(error.serverError || 'Could not update Trash auto-empty');
      }
    }
  );

  const { execute: runEmpty, isExecuting: emptying } = useAction(emptyTrash, {
    onSuccess: ({ data }) => {
      toast.success(
        data?.count
          ? `Emptied ${data.count} conversation${data.count === 1 ? '' : 's'}`
          : 'Trash is empty'
      );
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not empty Trash');
    }
  });

  React.useEffect(() => {
    setSelected(retention);
  }, [retention]);

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <h1 className="page-title">Trash</h1>
        <p className="mt-1 text-sm text-muted-foreground">Auto-empty after</p>
        <ToggleGroup
          type="single"
          value={selected}
          disabled={savingRetention}
          onValueChange={(value) => {
            if (!isMailTrashRetention(value) || value === selected) return;
            setSelected(value);
            saveRetention({ retention: value });
          }}
          className="mt-2 inline-flex h-8 justify-start rounded-lg border bg-muted/40 p-0.5"
        >
          {MAIL_TRASH_RETENTION_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-7 rounded-md px-2.5 font-mono text-[10px] uppercase tracking-wider data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <button
        type="button"
        disabled={!canEmpty || emptying}
        title="Empty trash"
        aria-label="Empty trash"
        onClick={() => setConfirmOpen(true)}
        className={cn(
          'flex size-16 shrink-0 items-center justify-center rounded-xl border transition-colors',
          'border-border bg-muted/20 text-muted-foreground',
          canEmpty &&
            'hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive',
          (!canEmpty || emptying) && 'cursor-not-allowed opacity-50'
        )}
      >
        {emptying ? (
          <SquircleLoader className="size-8" />
        ) : (
          <Trash
            className="size-9"
            weight="regular"
          />
        )}
      </button>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every conversation in Trash from Humaner
              and from your mailbox (Trash when available).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => runEmpty({ connectionId: mailbox ?? null })}
            >
              Empty trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
