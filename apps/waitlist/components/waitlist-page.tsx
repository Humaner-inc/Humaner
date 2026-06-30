'use client';

import Image from 'next/image';
import { useState } from 'react';

import { BrandStoriesSection } from '@/components/brand-stories-section';
import { HeroBackground } from '@/components/hero-background';

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
    <div className="relative">
      <section className="relative min-h-[100svh] overflow-hidden">
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
              <span className="whitespace-nowrap">Customer support</span>
              <br />
              that feels human.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Built for developers. Designed for customers.
            </p>
          </main>

          <a
            href="#story"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/35 transition-colors hover:text-white/60"
            aria-label="Scroll to our story"
          >
            <ScrollHintIcon />
          </a>
        </div>
      </section>

      <BrandStoriesSection
        email={email}
        formState={formState}
        errorMessage={errorMessage}
        onEmailChange={setEmail}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function ScrollHintIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6 animate-bounce"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 5V19M12 19L7 14M12 19L17 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
