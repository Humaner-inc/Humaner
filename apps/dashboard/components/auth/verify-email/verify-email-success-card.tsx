import * as React from 'react';
import Link from 'next/link';

import {
  authOnboardingHeadingClassName,
  authOnboardingLinkClassName,
  authOnboardingMutedClassName
} from '@/components/auth/auth-form-styles';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export function VerifyEmailSuccessCard(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <h1 className={authOnboardingHeadingClassName}>Email verified</h1>
        <p className={authOnboardingMutedClassName}>
          Your email has been verified. Continue setting up your workspace.
        </p>
      </div>
      <Link
        href={Routes.Onboarding}
        className={cn(
          authOnboardingLinkClassName,
          'inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#070607] text-sm font-medium text-[#f5f5f5] no-underline shadow-sm transition-all hover:bg-[#070607]/90 hover:text-[#f5f5f5]'
        )}
      >
        Continue to onboarding
      </Link>
    </div>
  );
}
