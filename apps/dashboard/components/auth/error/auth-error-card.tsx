import * as React from 'react';
import Link from 'next/link';
import { AlertCircleIcon } from '@humaner/shared/icons';

import {
  glassLinkClassName,
  glassMutedTextClassName
} from '@/components/auth/auth-form-styles';
import {
  AuthInnerCard,
  AuthInnerCardContent,
  AuthInnerCardDescription,
  AuthInnerCardFooter,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CardProps } from '@/components/ui/card';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export type AuthErrorCardProps = CardProps & {
  errorMessage: string;
};

export function AuthErrorCard({
  errorMessage,
  ...other
}: AuthErrorCardProps): React.JSX.Element {
  return (
    <AuthInnerCard {...other}>
      <AuthInnerCardHeader>
        <AuthInnerCardTitle>Auth Error</AuthInnerCardTitle>
        <AuthInnerCardDescription>
          An error occurred when logging you in. Head back to the login screen
          and try again.
        </AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardContent>
        <Alert variant="destructive">
          <div className="flex flex-row items-center gap-2 text-sm">
            <AlertCircleIcon className="size-[18px] shrink-0" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </div>
        </Alert>
      </AuthInnerCardContent>
      <AuthInnerCardFooter className="justify-center text-sm">
        <Link
          href={Routes.Login}
          className={cn(
            'underline',
            glassMutedTextClassName,
            glassLinkClassName
          )}
        >
          Back to log in
        </Link>
      </AuthInnerCardFooter>
    </AuthInnerCard>
  );
}
