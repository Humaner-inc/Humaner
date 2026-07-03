'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldIcon } from '@humaner/shared/icons';

import {
  AuthInnerCard,
  AuthInnerCardContent,
  AuthInnerCardDescription,
  AuthInnerCardFooter,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import { authInnerHighlightClassName, glassMutedTextClassName } from '@/components/auth/auth-form-styles';
import { buttonVariants } from '@/components/ui/button';
import type { CardProps } from '@/components/ui/card';
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
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router, redirectTo]);

  return countdown;
}

export function LogoutCard(props: CardProps): React.JSX.Element {
  const countdown = useCountdownRedirect(10, Routes.Login);
  return (
    <AuthInnerCard {...props}>
      <AuthInnerCardHeader className="text-center">
        <AuthInnerCardTitle>You've been logged out</AuthInnerCardTitle>
        <AuthInnerCardDescription>We hope to see you again soon!</AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardContent>
        <div className={authInnerHighlightClassName}>
          <div className="flex size-10 items-center justify-center rounded-full border border-[#070607]/10 bg-white/55 shadow-sm">
            <ShieldIcon className="size-5 text-primary" />
          </div>
          <span className="text-sm font-medium">Secure logout</span>
          <span className={cn('text-center text-xs', glassMutedTextClassName)}>
            The session has ended.
          </span>
        </div>
        <p className={cn('mt-4 text-center text-sm', glassMutedTextClassName)}>
          You will be redirected in{' '}
          <span className="font-medium text-[#070607]">{countdown}</span> seconds.
        </p>
      </AuthInnerCardContent>
      <AuthInnerCardFooter>
        <Link
          href={Routes.Login}
          className={buttonVariants({
            variant: 'default',
            className: 'w-full'
          })}
        >
          Back to log in
        </Link>
      </AuthInnerCardFooter>
    </AuthInnerCard>
  );
}
