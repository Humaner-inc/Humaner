'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { STARTER_CREDIT_USD } from '@humaner/shared/credits';
import { MailIcon } from '@humaner/shared/icons';
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck';
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
  showPrompt,
  variant = 'inbox'
}: {
  showPrompt: boolean;
  variant?: 'inbox' | 'credits';
}): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = React.useState(showPrompt);
  const [isPending, startTransition] = React.useTransition();
  const isCredits = variant === 'credits';

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
          {isCredits ? null : (
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
              <MailIcon className="size-5 text-muted-foreground" />
            </div>
          )}
          <DialogTitle
            className={isCredits ? 'flex items-center gap-2.5' : undefined}
          >
            {isCredits ? (
              <SealCheckIcon
                size={32}
                weight="fill"
                aria-hidden
              />
            ) : null}
            {isCredits ? 'Credits Granted' : 'Connect your Inboxes?'}
          </DialogTitle>
          <DialogDescription>
            {isCredits
              ? `$${STARTER_CREDIT_USD} just landed into your wallet to help you get started.`
              : 'You can link your mails right away to manage all your support in one place.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          {isCredits ? (
            <Button
              type="button"
              disabled={isPending}
              loading={isPending}
              onClick={() => resolvePrompt()}
            >
              Continue
            </Button>
          ) : (
            <>
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
