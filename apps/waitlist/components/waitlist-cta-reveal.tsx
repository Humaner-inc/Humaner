'use client';

import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type WaitlistCtaRevealProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

export function WaitlistCtaReveal({
  open,
  children,
  className
}: WaitlistCtaRevealProps): React.JSX.Element {
  return (
    <div
      className={cn('waitlist-cta mx-auto w-full max-w-lg text-center', className)}
      data-open={open ? 'true' : 'false'}
    >
      <div className="waitlist-cta__headline-wrap">
        <h3 className="story-sentence font-display text-[2.35rem] font-semibold leading-[1.22] tracking-tight sm:text-5xl sm:leading-[1.2]">
          Be among the first
        </h3>
      </div>

      <p className="waitlist-cta__sub mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/55 sm:mt-5 sm:text-base">
      </p>

      <div className="waitlist-cta__form">{children}</div>
    </div>
  );
}
