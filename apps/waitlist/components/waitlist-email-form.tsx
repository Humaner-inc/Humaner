'use client';

import { forwardRef } from 'react';

import { HighlightedEmailInput } from '@/components/highlighted-email-input';
import { WaitlistSuccessState } from '@/components/waitlist-success-state';
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
    if (formState === 'success') {
      return <WaitlistSuccessState className={className} />;
    }

    return (
      <form className={cn('w-full', className)} onSubmit={onSubmit}>
        <label htmlFor="waitlist-email-section" className="sr-only">
          Email
        </label>

        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:gap-5">
          <HighlightedEmailInput
            id="waitlist-email-section"
            name="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="your@company.com"
            autoComplete="email"
            required
            disabled={formState === 'loading'}
          />

          <button
            ref={buttonRef}
            type="submit"
            disabled={formState === 'loading'}
            className="group inline-flex h-9 shrink-0 items-center justify-center gap-0 rounded-md border border-transparent bg-[#f5f5f5] px-4 text-sm font-medium text-[#070607] shadow-sm transition-[gap] duration-200 hover:gap-1.5 hover:bg-[#f5f5f5]/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {formState === 'loading' ? 'Joining…' : 'Deploy early'}
            {formState !== 'loading' ? (
              <ArrowRightIcon className="size-0 shrink-0 opacity-0 transition-all duration-200 group-hover:size-4 group-hover:opacity-100" />
            ) : null}
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
