'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from '@humaner/shared/icons';

import {
  authHeadingClassName,
  authMutedTextClassName,
  authOutlineButtonClassName
} from '@/components/auth/auth-form-styles';
import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

function useCountdownRedirect(
  initialCountdown: number,
  redirectTo: string
): number {
  const [countdown, setCountdown] = React.useState(initialCountdown);
  const router = useRouter();

  React.useEffect(() => {
    if (countdown === 0) {
      router.push(redirectTo);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router, redirectTo]);

  return countdown;
}

export function LogoutCard(): React.JSX.Element {
  const countdown = useCountdownRedirect(10, Routes.Login);
  const oss = false; // Humaner brand chrome

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="space-y-2">
        <h1 className={cn(authHeadingClassName, 'text-4xl')}>
          You&apos;ve been logged out
        </h1>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-full border',
            oss
              ? 'border-[#eaeaea] bg-[#f2f2f2]'
              : 'border-white/[0.08] bg-white/[0.04]'
          )}
        >
          <ShieldCheck
            className={cn('size-5', oss ? 'text-[#18181b]' : 'text-[#e0e1df]')}
          />
        </div>
      </div>

      <p className={cn('text-sm', authMutedTextClassName)}>
        You will be redirected in{' '}
        <span
          className={cn(
            'font-medium',
            oss ? 'text-[#0A0D0D]' : 'text-[#fcf4ec]'
          )}
        >
          {countdown}
        </span>{' '}
        seconds.
      </p>

      <Button
        type="button"
        variant="ghost"
        className={authOutlineButtonClassName}
        asChild
      >
        <Link href={Routes.Login}>Back to log in</Link>
      </Button>
    </div>
  );
}
