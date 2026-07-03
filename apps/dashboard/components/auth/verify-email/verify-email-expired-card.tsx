'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { resendEmailConfirmation } from '@/actions/auth/resend-email-confirmation';
import {
  AuthInnerCard,
  AuthInnerCardDescription,
  AuthInnerCardFooter,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import { glassLinkClassName, glassMutedTextClassName } from '@/components/auth/auth-form-styles';
import { Button } from '@/components/ui/button';
import type { CardProps } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type VerifyEmailExpiredCardProps = CardProps & {
  email: string;
};

export function VerifyEmailExpiredCard({
  email,
  ...other
}: VerifyEmailExpiredCardProps): React.JSX.Element {
  const [isResendingEmailVerification, setIsResendingEmailVerification] =
    React.useState<boolean>(false);
  const handleResendEmailVerification = async (): Promise<void> => {
    setIsResendingEmailVerification(true);
    const result = await resendEmailConfirmation({ email });
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Email verification resent');
    } else {
      toast.error("Couldn't resend verification");
    }
    setIsResendingEmailVerification(false);
  };
  return (
    <AuthInnerCard {...other}>
      <AuthInnerCardHeader>
        <AuthInnerCardTitle>Email verificatio is expired</AuthInnerCardTitle>
        <AuthInnerCardDescription>
          Sorry, your email verification is already expired! You need to request
          a verification again.
        </AuthInnerCardDescription>
      </AuthInnerCardHeader>
      <AuthInnerCardFooter
        className={cn('justify-center gap-1 text-sm', glassMutedTextClassName)}
      >
        Didn't receive an email?
        <Button
          type="button"
          variant="link"
          className={cn('h-fit px-0.5 py-0 underline', glassLinkClassName)}
          disabled={isResendingEmailVerification}
          onClick={handleResendEmailVerification}
        >
          Resend email verification
        </Button>
      </AuthInnerCardFooter>
    </AuthInnerCard>
  );
}
