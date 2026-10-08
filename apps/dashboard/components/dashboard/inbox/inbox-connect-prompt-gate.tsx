'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MailIcon } from '@humaner/shared/icons';
import { toast } from 'sonner';

import { dismissInboxConnectPrompt } from '@/actions/inbox/dismiss-inbox-connect-prompt';
import { HumanerLogoImage } from '@/components/brand/humaner-logo-image';
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
import { VIRAL_BETA_STARTER_CREDIT_USD } from '@/lib/auth/viral-beta-constants';
import { cn } from '@/lib/utils';

export function InboxConnectPromptGate({
  showPrompt,
  variant = 'inbox',
  creditsUsd = VIRAL_BETA_STARTER_CREDIT_USD
}: {
  showPrompt: boolean;
  variant?: 'inbox' | 'credits';
  /** Dollar amount shown in the credits grant copy. */
  creditsUsd?: number;
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
      <DialogContent
        className={cn(
          isCredits
            ? 'gap-0 overflow-hidden border-[#0A0D0D]/8 bg-[#f2f2f2] p-0 text-[#0A0D0D] shadow-[0_32px_80px_-20px_rgb(0_0_0_/_0.55)] sm:max-w-[22rem]'
            : 'sm:max-w-md'
        )}
      >
        {isCredits ? (
          <>
            <DialogHeader className="space-y-0 px-6 pb-2 pt-8 text-center sm:text-center">
              <DialogTitle className="sr-only">Credits granted</DialogTitle>
              <div className="mx-auto flex justify-center">
                <HumanerLogoImage
                  alt="Humaner"
                  width={56}
                  height={56}
                  tone="light"
                  className="size-14"
                />
              </div>
              <DialogDescription className="mt-5 space-y-1.5 text-center">
                <span className="block font-display text-[1.35rem] font-normal leading-snug tracking-tight text-[#0A0D0D]">
                  ${creditsUsd} credits were added to your account.
                </span>
                <span className="block text-sm text-[#0A0D0D]/55">
                  Happy and fast emailing.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="px-6 pb-6 pt-6 sm:justify-stretch">
              <Button
                type="button"
                disabled={isPending}
                loading={isPending}
                className="h-8 w-full rounded-full bg-[#0A0D0D] text-[#f2f2f2] hover:bg-[#161919] hover:text-[#f2f2f2]"
                onClick={() => resolvePrompt()}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
                <MailIcon className="size-5 text-muted-foreground" />
              </div>
              <DialogTitle>Connect your Inboxes?</DialogTitle>
              <DialogDescription>
                You can link your mails right away to manage all your support in
                one place.
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
