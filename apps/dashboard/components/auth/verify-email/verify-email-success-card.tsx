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

export function VerifyEmailSuccessCard(props: CardProps): React.JSX.Element {
  return (
    <AuthInnerCard {...props}>
      <AuthInnerCardHeader>
        <AuthInnerCardTitle>Email verified</AuthInnerCardTitle>
        <AuthInnerCardDescription>
          Your email has been verified. Continue setting up your workspace.
        </AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardFooter className="justify-center text-sm">
        <Link href={Routes.Onboarding} className={cn('underline', glassLinkClassName)}>
          Continue to onboarding
        </Link>
      </AuthInnerCardFooter>
    </AuthInnerCard>
  );
}
