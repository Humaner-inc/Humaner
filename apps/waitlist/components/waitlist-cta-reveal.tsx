'use client';

import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';

import { WaitlistSuccessState } from '@/components/waitlist-success-state';
import type { FormState } from '@/components/waitlist-email-form';
import { cn } from '@/lib/utils';

type WaitlistCtaRevealProps = {
  open: boolean;
  formState: FormState;
  children: ReactNode;
  className?: string;
};

const SUCCESS_SWAP_DELAY_MS = 800;

export function WaitlistCtaReveal({
  open,
  formState,
  children,
  className
}: WaitlistCtaRevealProps): React.JSX.Element {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (formState !== 'success') {
      setShowSuccess(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSuccess(true);
    }, SUCCESS_SWAP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [formState]);

  return (
    <div
      className={cn('waitlist-cta mx-auto w-full max-w-2xl text-center', className)}
      data-open={open ? 'true' : 'false'}
    >
      <div className="waitlist-cta__headline-wrap">
        <Image
          src="/favicon.svg"
          alt=""
          width={64}
          height={64}
          unoptimized
          className="mx-auto mb-5 size-16"
        />
        <h3 className="story-sentence font-display text-[2.35rem] font-semibold leading-[1.22] tracking-tight sm:text-5xl sm:leading-[1.2]">
          Humaner
        </h3>
      </div>

      {showSuccess ? (
        <div className="waitlist-cta__sub mx-auto mt-4 max-w-sm sm:mt-5">
          <WaitlistSuccessState />
        </div>
      ) : (
        <p className="waitlist-cta__sub mx-auto mt-4 text-sm leading-relaxed text-white/55 sm:mt-5 sm:text-base">
          <span className="block sm:whitespace-nowrap">
            Being early will grant exclusive benefits.
          </span>
          <span className="block sm:whitespace-nowrap">
            Benefits others will have to pay for.
          </span>
        </p>
      )}

      {!showSuccess ? <div className="waitlist-cta__form">{children}</div> : null}
    </div>
  );
}
