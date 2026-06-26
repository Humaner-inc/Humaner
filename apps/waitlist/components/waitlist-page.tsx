'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { HeroBackground } from './hero-background';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function WaitlistPage(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormState('error');
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setFormState('success');
    } catch {
      setFormState('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center sm:pt-32">
        <header className="mb-10 flex justify-center sm:mb-12">
          <div className="inline-flex items-center gap-3.5 sm:gap-4">
            <Image
              src="/humaner.svg"
              alt=""
              width={600}
              height={600}
              priority
              unoptimized
              className="h-14 w-auto brightness-0 invert sm:h-[4.25rem] lg:h-[4.75rem]"
            />
            <span className="font-display text-3xl tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Humaner
            </span>
          </div>
        </header>

        <main className="flex w-full flex-col items-center">
          <h1 className="max-w-4xl font-display text-[2.35rem] font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
            <span className="whitespace-nowrap">Customer agents for developers</span>
            <br />
            but Humaner.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Before Humaner everything was generic.
            <br />
            Now every part of your business sounds like you.
          </p>

          {formState === 'success' ? (
            <div className="mt-10 w-full max-w-lg rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-left backdrop-blur-xl">
              <p className="text-sm font-medium text-white">You&apos;re on the list.</p>
              <p className="mt-1 text-sm text-white/60">
                We&apos;ll email you before launch so you can claim a Founding Member seat.
              </p>
            </div>
          ) : (
            <form className="mt-10 w-full max-w-lg" onSubmit={handleSubmit}>
              <label
                htmlFor="waitlist-email"
                className="block text-left text-[11px] font-medium uppercase tracking-[0.18em] text-white/40"
              >
                Email
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <input
                  id="waitlist-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your@company.com"
                  autoComplete="email"
                  required
                  disabled={formState === 'loading'}
                  className="min-h-12 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-sm text-white outline-none transition-colors placeholder:text-white/45 backdrop-blur-xl focus:border-white/35 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={formState === 'loading'}
                  className={cn(
                    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-medium text-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                  )}
                >
                  {formState === 'loading' ? 'Joining…' : 'Join the waitlist'}
                  <ArrowRightIcon />
                </button>
              </div>
              {formState === 'error' && errorMessage ? (
                <p className="mt-3 text-left text-sm text-red-300">{errorMessage}</p>
              ) : null}
            </form>
          )}

          <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-white/40">
            Join for free and get notified before launch to claim one of the 50 Founding
            Member seats — locking a discounted price for 2 years.
          </p>
        </main>
      </div>
    </div>
  );
}

function ArrowRightIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
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
