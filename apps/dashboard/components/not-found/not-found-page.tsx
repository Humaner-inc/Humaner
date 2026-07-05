'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  authHighlightButtonClassName
} from '@/components/auth/auth-form-styles';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export const notFoundNumberClassName =
  'bg-gradient-to-b from-white via-white/75 to-white/5 bg-clip-text text-[8rem] font-extrabold leading-[0.85] tracking-tighter text-transparent sm:text-[10rem] lg:text-[12rem] xl:text-[14rem]';

export type NotFoundPageProps = {
  homeHref?: string;
  className?: string;
};

export function NotFoundPage({
  homeHref = Routes.Home,
  className
}: NotFoundPageProps): React.JSX.Element {
  const router = useRouter();

  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col bg-[#070607] text-[#f5f5f5] lg:flex-row',
        className
      )}
    >
      <Link
        href={homeHref}
        className="absolute left-6 top-6 z-20"
        aria-label="Humaner home"
      >
        <Logo
          hideSymbol
          className="gap-0 [&_span]:text-lg [&_span]:text-white sm:[&_span]:text-xl"
        />
      </Link>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-24 lg:w-1/2 lg:px-12 lg:pb-12 lg:pt-16 xl:px-16">
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <span
            aria-hidden
            className={cn('block', notFoundNumberClassName)}
          >
            404
          </span>
          <Button
            type="button"
            variant="ghost"
            className={cn(authHighlightButtonClassName, 'mt-10 w-full max-w-xs hover:text-[#070607]')}
            onClick={() => router.back()}
          >
            Go back
          </Button>
        </div>
      </main>

      <aside className="relative order-first h-[min(42vh,22rem)] w-full shrink-0 lg:order-last lg:h-auto lg:w-1/2">
        <div className="absolute inset-x-4 inset-y-4 overflow-hidden rounded-2xl bg-[#070607] lg:inset-4">
          <Image
            src="/404.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="rounded-2xl object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070607] via-[#070607]/15 to-transparent lg:bg-gradient-to-l lg:from-[#070607] lg:via-[#070607]/25 lg:to-transparent" />
        </div>
      </aside>
    </div>
  );
}
