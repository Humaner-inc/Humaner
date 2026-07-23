'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MailIcon } from '@humaner/shared/icons';
import { toast } from 'sonner';

import { dismissInboxConnectPrompt } from '@/actions/inbox/dismiss-inbox-connect-prompt';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Routes } from '@/constants/routes';

export function InboxConnectPromptGate({
  showPrompt
}: {
  showPrompt: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = React.useState(showPrompt);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setOpen(showPrompt);
  }, [showPrompt]);

  const resolvePrompt = (destination?: string): void => {
    startTransition(async () => {
      const result = await dismissInboxConnectPrompt({});
      if (result?.serverError || result?.validationErrors) {
        toast.error('Could not save your choice. Please try again.');
        return;
      }

      setOpen(false);
      if (destination) router.push(destination);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) resolvePrompt();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
            <MailIcon className="size-5 text-muted-foreground" />
          </div>
          <DialogTitle>Your paid plan is active</DialogTitle>
          <DialogDescription>
            Inbox is optional. If you want, connect IMAP or Gmail and bring
            support aliases such as hello@ or security@ into Humaner.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => resolvePrompt()}
          >
            Not now
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => resolvePrompt(Routes.InboxProviders)}
          >
            Set up Inbox
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
