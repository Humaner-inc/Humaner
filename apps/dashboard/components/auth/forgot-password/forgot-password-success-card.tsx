import * as React from 'react';
import Link from 'next/link';
import { InfoIcon } from '@humaner/shared/icons';

import {
  AuthInnerCard,
  AuthInnerCardContent,
  AuthInnerCardDescription,
  AuthInnerCardFooter,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import { glassLinkClassName } from '@/components/auth/auth-form-styles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CardProps } from '@/components/ui/card';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export type ForgotPasswordSuccessCardProps = CardProps & {
  email: string;
};

export function ForgotPasswordSuccessCard({
  email,
  ...other
}: ForgotPasswordSuccessCardProps): React.JSX.Element {
  return (
    <AuthInnerCard {...other}>
      <AuthInnerCardHeader>
        <AuthInnerCardTitle>Reset instructions sent</AuthInnerCardTitle>
        <AuthInnerCardDescription>
          An email with a link and reset instructions is on its way to{' '}
          <strong className="font-medium text-[#f5f5f5]">{email}</strong>.
        </AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardContent>
        <Alert variant="info">
          <div className="flex flex-row items-start gap-2">
            <InfoIcon className="mt-0.5 size-[18px] shrink-0" />
            <AlertDescription>
              If you don't receive an email soon, check that the email address
              you entered is correct, check your spam folder or reach out to
              support if the issue persists.
            </AlertDescription>
          </div>
        </Alert>
      </AuthInnerCardContent>
      <AuthInnerCardFooter className="justify-center text-sm">
        <Link href={Routes.Login} className={cn('underline', glassLinkClassName)}>
          Back to log in
        </Link>
      </AuthInnerCardFooter>
    </AuthInnerCard>
  );
}
