'use client';

import { ctaPrimaryClassName } from '@humaner/shared/cta';
import {
  CircleCheck,
  Loader2Icon,
  type AnimatedIconHandle
} from '@humaner/shared/icons';
import { forwardRef, useEffect, useRef } from 'react';

import { HighlightedEmailInput } from '@/components/highlighted-email-input';
import { cn } from '@/lib/utils';

export type FormState = 'idle' | 'loading' | 'success' | 'error';

type WaitlistEmailFormProps = {
  email: string;
  formState: FormState;
  errorMessage: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
};

export const WaitlistEmailForm = forwardRef<HTMLButtonElement, WaitlistEmailFormProps>(
  function WaitlistEmailForm(
    {
      email,
      formState,
      errorMessage,
      onEmailChange,
      onSubmit,
      className
    },
    buttonRef
  ) {
    const checkRef = useRef<AnimatedIconHandle>(null);

    useEffect(() => {
      if (formState !== 'success') {
        return;
      }

      const animationTimer = window.setTimeout(() => {
        checkRef.current?.startAnimation();
      }, 50);

      return () => window.clearTimeout(animationTimer);
    }, [formState]);

    return (
      <form className={cn('w-full', className)} onSubmit={onSubmit}>
        <label htmlFor="waitlist-email-section" className="sr-only">
          Email
        </label>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-5">
          <HighlightedEmailInput
            id="waitlist-email-section"
            name="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="your@company.com"
            autoComplete="email"
            required
            disabled={formState === 'loading' || formState === 'success'}
          />

          <button
            ref={buttonRef}
            type="submit"
            disabled={formState === 'loading' || formState === 'success'}
            aria-busy={formState === 'loading'}
            className={cn(
              ctaPrimaryClassName,
              'group h-9 shrink-0 px-4 transition-[gap] duration-200',
              formState === 'loading' && 'disabled:opacity-50',
              formState === 'success' && 'opacity-100',
              formState === 'idle' && 'gap-0 hover:gap-1.5',
              (formState === 'loading' || formState === 'success') && 'gap-2'
            )}
          >
            {formState === 'loading' ? (
              <>
                Joining…
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              </>
            ) : formState === 'success' ? (
              <>
                <span className="sr-only">Joined</span>
                <CircleCheck ref={checkRef} className="size-4 text-emerald-700" />
              </>
            ) : (
              <>
                Deploy early
                <ArrowRightIcon className="size-0 shrink-0 opacity-0 transition-all duration-200 group-hover:size-4 group-hover:opacity-100" />
              </>
            )}
          </button>
        </div>

        {formState === 'error' && errorMessage ? (
          <p className="mt-3 text-center text-sm text-red-300/90">{errorMessage}</p>
        ) : null}
      </form>
    );
  }
);

function ArrowRightIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" className={cn('size-4', className)} fill="none" aria-hidden>
      <path
        d="M3 8H13M13 8L9 4M13 8L9 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
