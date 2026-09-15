'use client';

import * as React from 'react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const SKIP_DELETE_WARNING_KEY = 'inbox:skip-delete-warning:v1';

export function readSkipDeleteWarning(): boolean {
  try {
    return localStorage.getItem(SKIP_DELETE_WARNING_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeSkipDeleteWarning(skip: boolean): void {
  try {
    if (skip) {
      localStorage.setItem(SKIP_DELETE_WARNING_KEY, '1');
    } else {
      localStorage.removeItem(SKIP_DELETE_WARNING_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function DeleteMailThreadsDialog({
  open,
  count,
  mode = 'trash',
  onOpenChange,
  onConfirm
}: {
  open: boolean;
  count: number;
  mode?: 'trash' | 'forever';
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const forever = mode === 'forever';

  React.useEffect(() => {
    if (open) setDontShowAgain(false);
  }, [open]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {forever ? 'Delete' : 'Move'}{' '}
            {count === 1 ? 'this conversation' : `${count} conversations`}
            {forever ? '?' : ' to Trash?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {forever
              ? `This removes ${count === 1 ? 'it' : 'them'} from Humaner and deletes ${count === 1 ? 'the messages' : 'their messages'} from your mailbox (Trash when available).`
              : `You can restore ${count === 1 ? 'it' : 'them'} from Trash. Delete again to remove ${count === 1 ? 'it' : 'them'} from the mailbox.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            id="skip-mail-delete-warning"
            checked={dontShowAgain}
            onCheckedChange={(value) => setDontShowAgain(value === true)}
          />
          <Label
            htmlFor="skip-mail-delete-warning"
            className="cursor-pointer font-fellix text-sm font-normal text-muted-foreground"
          >
            Don&apos;t show this message again
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (dontShowAgain) writeSkipDeleteWarning(true);
              onConfirm();
            }}
          >
            {forever ? 'Delete forever' : 'Move to Trash'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Run delete immediately if the user opted out of the warning, otherwise open the dialog. */
export function requestMailDelete(
  skipWarning: boolean,
  openDialog: () => void,
  confirm: () => void
): void {
  if (skipWarning) {
    confirm();
    return;
  }
  openDialog();
}
