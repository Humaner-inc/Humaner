import * as React from 'react';
import Link from 'next/link';

import {
  AuthInnerCard,
  AuthInnerCardContent,
  AuthInnerCardDescription,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import { glassLinkClassName, glassMutedTextClassName } from '@/components/auth/auth-form-styles';
import type { CardProps } from '@/components/ui/card';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export type ChangeEmailSuccessCardProps = CardProps & {
  email: string;
};

export function ChangeEmailSuccessCard({
  email,
  ...other
}: ChangeEmailSuccessCardProps): React.JSX.Element {
  return (
    <AuthInnerCard {...other}>
      <AuthInnerCardHeader>
        <AuthInnerCardTitle className="text-xl">Email changed</AuthInnerCardTitle>
        <AuthInnerCardDescription>
          Your email has been successfully changed to <strong>{email}</strong>.
          As a result, you've been logged out and must log back in.
        </AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardContent>
        <div className={cn('text-center text-sm', glassMutedTextClassName)}>
          <Link href={Routes.Login} className={cn('underline', glassLinkClassName)}>
            Go to log in
          </Link>
        </div>
      </AuthInnerCardContent>
    </AuthInnerCard>
  );
}
