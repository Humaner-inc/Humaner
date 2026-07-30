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

export type DeleteAgentDialogProps = {
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void;
};

export function DeleteAgentDialog({
  agentName,
  open,
  onOpenChange,
  isDeleting,
  onConfirm
}: DeleteAgentDialogProps): React.JSX.Element {
  const [acknowledged, setAcknowledged] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setAcknowledged(false);
    }
  }, [open]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {agentName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Deletion will remove all related data and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-3 px-1">
          <Checkbox
            id="delete-agent-acknowledge"
            checked={acknowledged}
            onCheckedChange={(value) => setAcknowledged(value === true)}
            disabled={isDeleting}
          />
          <Label
            htmlFor="delete-agent-acknowledge"
            className="cursor-pointer text-sm font-normal leading-snug text-foreground"
          >
            Yes, I want to delete {agentName}.
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || !acknowledged}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete agent'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
