'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, XIcon } from '@humaner/shared/icons';

import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { writeMfaBannerDismissCookie } from '@/lib/auth/mfa-banner-dismiss';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export function MfaRecommendedBannerClient({
  className
}: {
  className?: string;
}): React.JSX.Element | null {
  const [open, setOpen] = React.useState(true);
  const [present, setPresent] = React.useState(true);

  const dismiss = React.useCallback(() => {
    writeMfaBannerDismissCookie();
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reduce) {
      setPresent(false);
      return;
    }
    setOpen(false);
  }, []);

  const onTransitionEnd = React.useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.propertyName !== 'grid-template-rows') return;
      if (!open) setPresent(false);
    },
    [open]
  );

  if (!present) return null;

  return (
    <div
      aria-hidden={open ? undefined : true}
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
        open
          ? 'grid-rows-[1fr] opacity-100'
          : 'pointer-events-none grid-rows-[0fr] opacity-0'
      )}
      onTransitionEnd={onTransitionEnd}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn('mb-6', className)}>
          <div
            role="status"
            className={cn(
              dashboardRadiusClassName,
              'flex items-start gap-3 border border-border/70 bg-muted/50 py-3 pl-3.5 pr-2 sm:items-center'
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f85919]/12 text-[#f85919]">
              <ShieldCheck className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-sm font-medium leading-none text-foreground">
                  Two-factor authentication
                </p>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#f85919]">
                  Recommended
                </p>
              </div>
              <p className="mt-1 text-sm font-light leading-snug text-muted-foreground">
                Workspace owners and platform admins should use an authenticator
                app.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
              <Button
                asChild
                variant="accent"
                size="sm"
                className="h-7 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em]"
              >
                <Link href={`${Routes.Security}#account-mfa`}>Enable</Link>
              </Button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Hide for 30 days"
                title="Hide for 30 days"
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
