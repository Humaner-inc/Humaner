import * as React from 'react';
import Link from 'next/link';

import {
  authHeadingClassName,
  authMutedTextClassName,
  authPrimaryButtonClassName
} from '@/components/auth/auth-form-styles';
import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';

export function VerifyEmailSuccessCard(): React.JSX.Element {
  const oss = isOssDeployment();
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1.5 text-center">
        <h1 className={cn(authHeadingClassName, 'text-xl')}>Email verified</h1>
        <p className={authMutedTextClassName}>
          {oss
            ? 'Your email has been verified. Open your workspace to create an agent.'
            : 'Your email has been verified. Continue setting up your workspace.'}
        </p>
      </div>
      <Link
        href={oss ? Routes.Home : Routes.Onboarding}
        className={cn(authPrimaryButtonClassName, 'no-underline')}
      >
        {oss ? 'Open workspace' : 'Continue to onboarding'}
      </Link>
    </div>
  );
}
