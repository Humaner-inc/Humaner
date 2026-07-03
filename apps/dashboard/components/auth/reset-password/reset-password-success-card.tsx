import * as React from 'react';
import Link from 'next/link';

import {
  AuthInnerCard,
  AuthInnerCardDescription,
  AuthInnerCardFooter,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import { glassLinkClassName } from '@/components/auth/auth-form-styles';
import type { CardProps } from '@/components/ui/card';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export function ResetPasswordSuccessCard(props: CardProps): React.JSX.Element {
  return (
    <AuthInnerCard {...props}>
      <AuthInnerCardHeader>
        <AuthInnerCardTitle>Password updated</AuthInnerCardTitle>
        <AuthInnerCardDescription>
          Your password has been successfully changed. Use your new password to
          log in.
        </AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardFooter className="justify-center text-sm">
        <Link href={Routes.Login} className={cn('underline', glassLinkClassName)}>
          Back to log in
        </Link>
      </AuthInnerCardFooter>
    </AuthInnerCard>
  );
}
