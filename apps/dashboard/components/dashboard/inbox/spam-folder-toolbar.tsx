'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { emptySpam } from '@/actions/inbox/manage-mail-thread';
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
import { cn } from '@/lib/utils';

export function SpamFolderToolbar({
  mailbox = null,
  canEmpty
}: {
  mailbox?: string | null;
  canEmpty: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const { execute: runEmpty, isExecuting: emptying } = useAction(emptySpam, {
    onSuccess: ({ data }) => {
      toast.success(
        data?.count
          ? `Emptied ${data.count} conversation${data.count === 1 ? '' : 's'}`
          : 'Spam is empty'
      );
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not empty Spam');
    }
  });

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-sm font-medium text-foreground">Spam</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mail from blocked senders and reported spam.
        </p>
      </div>

      <button
        type="button"
        disabled={!canEmpty || emptying}
        title="Empty spam"
        aria-label="Empty spam"
        onClick={() => setConfirmOpen(true)}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
          'border-border bg-muted/20 text-muted-foreground',
          canEmpty &&
            'hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive',
          (!canEmpty || emptying) && 'cursor-not-allowed opacity-50'
        )}
      >
        {emptying ? (
          <SquircleLoader className="size-4" />
        ) : (
          <Trash
            className="size-5"
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
            <AlertDialogTitle>Empty Spam?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every conversation in Spam from Humaner
              and from your mailbox (Spam when available).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => runEmpty({ connectionId: mailbox ?? null })}
            >
              Empty spam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
