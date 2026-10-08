'use client';

import * as React from 'react';
import { InfoIcon } from '@humaner/shared/icons';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export function BlockMailSenderDialog({
  open,
  sender,
  onOpenChange,
  onConfirm
}: {
  open: boolean;
  sender?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const label = sender?.trim() || 'this sender';

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            New mail from this address goes to Spam.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          You can unblock later
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Where to unblock"
              >
                <InfoIcon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="z-[60] max-w-52 text-xs leading-relaxed"
            >
              Unblock from Workspace settings → Inbox.
            </TooltipContent>
          </Tooltip>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
          >
            Block sender
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
