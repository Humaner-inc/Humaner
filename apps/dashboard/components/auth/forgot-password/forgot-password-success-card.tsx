import * as React from 'react';
import Link from 'next/link';
import { InfoIcon } from '@humaner/shared/icons';

import {
  authMutedTextClassName,
  authOutlineButtonClassName,
  authPageTitleClassName
} from '@/components/auth/auth-form-styles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';

export type ForgotPasswordSuccessCardProps = {
  email: string;
};

export function ForgotPasswordSuccessCard({
  email
}: ForgotPasswordSuccessCardProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className={authPageTitleClassName}>{AppInfo.APP_NAME}</h1>
        <p className={authMutedTextClassName}>
          {email ? (
            <>
              Reset instructions are on the way to{' '}
              <span className="font-medium text-[#f2f2f2]">{email}</span>.
            </>
          ) : (
            'Reset instructions are on the way.'
          )}
        </p>
      </div>

      <Alert
        variant="info"
        className="border-white/[0.08] bg-white/[0.03] text-[#f2f2f2]/80"
      >
        <div className="flex flex-row items-start gap-2">
          <InfoIcon className="mt-0.5 size-[18px] shrink-0 text-[#f2f2f2]/55" />
          <AlertDescription>
            If you don&apos;t receive an email soon, check that the address is
            correct, look in spam, or reach out to support.
          </AlertDescription>
        </div>
      </Alert>

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
