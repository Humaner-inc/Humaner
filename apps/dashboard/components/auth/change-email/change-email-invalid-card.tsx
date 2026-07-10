import * as React from 'react';
import Link from 'next/link';

import {
  glassLinkClassName,
  glassMutedTextClassName
} from '@/components/auth/auth-form-styles';
import {
  AuthInnerCard,
  AuthInnerCardContent,
  AuthInnerCardDescription,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import type { CardProps } from '@/components/ui/card';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export function ChangeEmailInvalidCard(props: CardProps): React.JSX.Element {
  return (
    <AuthInnerCard {...props}>
      <AuthInnerCardHeader>
        <AuthInnerCardTitle>Change request is invalid</AuthInnerCardTitle>
        <AuthInnerCardDescription>
          Sorry, but your email change request is not valid! This can occur if
          you submit several change requests, each of which invalidates the
          prior ones, or if you have already changed your email.
        </AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardContent>
        <div className={cn('text-center text-sm', glassMutedTextClassName)}>
          <Link
            href={Routes.Account}
            className={cn('underline', glassLinkClassName)}
          >
            Go to account settings
          </Link>
        </div>
      </AuthInnerCardContent>
    </AuthInnerCard>
  );
}
