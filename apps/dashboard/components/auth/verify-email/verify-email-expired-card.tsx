'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { resendEmailConfirmation } from '@/actions/auth/resend-email-confirmation';
import {
  authHeadingClassName,
  authLinkClassName,
  authMutedTextClassName
} from '@/components/auth/auth-form-styles';
import { cn } from '@/lib/utils';

export type VerifyEmailExpiredCardProps = {
  email: string;
};

export function VerifyEmailExpiredCard({
  email
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
    <div className="flex flex-col gap-5">
      <div className="space-y-1.5 text-center">
        <h1 className={cn(authHeadingClassName, 'text-xl')}>
          Email verification expired
        </h1>
        <p className={authMutedTextClassName}>
          Sorry, your email verification has expired. Request a new code to
          continue.
        </p>
      </div>

      <p className={cn('text-center', authMutedTextClassName)}>
        Didn&apos;t receive an email?{' '}
        <button
          type="button"
          className={authLinkClassName}
          disabled={isResendingEmailVerification}
          onClick={() => void handleResendEmailVerification()}
        >
          {isResendingEmailVerification
            ? 'Sending…'
            : 'Resend email verification'}
        </button>
      </p>
    </div>
  );
}
