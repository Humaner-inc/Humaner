import * as React from 'react';
import Link from 'next/link';

import { glassLinkClassName } from '@/components/auth/auth-form-styles';
import {
  AuthInnerCard,
  AuthInnerCardDescription,
  AuthInnerCardFooter,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import type { CardProps } from '@/components/ui/card';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export function ResetPasswordExpiredCard(props: CardProps): React.JSX.Element {
  return (
    <AuthInnerCard {...props}>
      <AuthInnerCardHeader>
        <AuthInnerCardTitle>Reset request is expired</AuthInnerCardTitle>
        <AuthInnerCardDescription>
          Go back and enter the email associated with your account and we will
          send you another link with instructions to reset your password.
        </AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardFooter className="justify-center text-sm">
        <Link
          href={Routes.ForgotPassword}
          className={cn('underline', glassLinkClassName)}
        >
          Want to try again?
        </Link>
      </AuthInnerCardFooter>
    </AuthInnerCard>
  );
}
