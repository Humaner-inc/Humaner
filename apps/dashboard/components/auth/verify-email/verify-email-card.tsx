'use client';

import * as React from 'react';
import { CheckIcon } from '@humaner/shared/icons';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { resendEmailConfirmation } from '@/actions/auth/resend-email-confirmation';
import { verifyEmailWithOtp } from '@/actions/auth/verify-email-with-otp';
import {
  authDestructiveMessageClassName,
  authHeadingClassName,
  authLinkClassName,
  authMutedTextClassName,
  authOtpSlotClassName,
  authOtpSlotRingClassName,
  authPrimaryButtonClassName
} from '@/components/auth/auth-form-styles';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import { EMAIL_OTP_LENGTH } from '@/constants/limits';
import { useZodForm } from '@/hooks/use-zod-form';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';
import {
  verifyEmailWithOtpSchema,
  type VerifyEmailWithOtpSchema
} from '@/schemas/auth/verify-email-with-otp-schema';

export type VerifyEmailCardProps = {
  email: string;
  className?: string;
};

export function VerifyEmailCard({
  email,
  className
}: VerifyEmailCardProps): React.JSX.Element {
  const oss = isOssDeployment();
  const [verifySuccess, setVerifySuccess] = React.useState(false);
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

  const methods = useZodForm({
    schema: verifyEmailWithOtpSchema,
    mode: 'onSubmit',
    defaultValues: {
      email,
      otp: ''
    }
  });
  const isVerifying = methods.formState.isSubmitting;
  const canSubmit = !isVerifying && !verifySuccess;

  const onSubmit: SubmitHandler<VerifyEmailWithOtpSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await verifyEmailWithOtp({
      ...values,
      email: values.email || email
    });
    if (result?.data?.redirectTo) {
      setVerifySuccess(true);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 550);
      });
      // Full navigation so the session cookie from the server action is applied
      // before the next page reads auth (router.push can race → /auth/login).
      window.location.assign(result.data.redirectTo);
      return;
    }
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't verify email");
    }
  };

  return (
    <FormProvider {...methods}>
      <div className={cn('flex flex-col gap-5', className)}>
        <div className="space-y-1.5 text-center">
          <h1 className={cn(authHeadingClassName, 'text-xl')}>
            Verify your email
          </h1>
          <p className={authMutedTextClassName}>
            {email ? (
              <>
                Enter the code we sent to{' '}
                <span
                  className={cn(
                    'font-medium',
                    oss ? 'text-zinc-950' : 'text-[#fff8f2]'
                  )}
                >
                  {email}
                </span>
                .
              </>
            ) : (
              'Enter the code we sent to your inbox.'
            )}
          </p>
        </div>

        <form
          className="flex flex-col items-center gap-5"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <div className="flex w-fit flex-col gap-5">
            <FormField
              control={methods.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col items-center space-y-2">
                  <FormControl>
                    <InputOTP
                      {...field}
                      inputMode="numeric"
                      maxLength={EMAIL_OTP_LENGTH}
                      pattern={REGEXP_ONLY_DIGITS}
                      disabled={isVerifying || verifySuccess}
                      onComplete={methods.handleSubmit(onSubmit)}
                    >
                      <InputOTPGroup className="justify-center gap-2.5">
                        {Array.from(
                          { length: EMAIL_OTP_LENGTH },
                          (_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className={cn(
                                authOtpSlotClassName,
                                authOtpSlotRingClassName
                              )}
                            />
                          )
                        )}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage className={authDestructiveMessageClassName} />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="ghost"
              className={authPrimaryButtonClassName}
              disabled={!canSubmit}
              loading={isVerifying}
            >
              {verifySuccess ? (
                <CheckIcon
                  className="size-4"
                  strokeWidth={2.5}
                />
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </form>

        <p className={cn('text-center', authMutedTextClassName)}>
          Didn&apos;t receive an email?{' '}
          <button
            type="button"
            className={cn(
              authLinkClassName,
              'disabled:pointer-events-none disabled:opacity-50'
            )}
            disabled={
              isVerifying || verifySuccess || isResendingEmailVerification
            }
            onClick={() => void handleResendEmailVerification()}
          >
            {isResendingEmailVerification ? 'Sending…' : 'Resend'}
          </button>
        </p>
      </div>
    </FormProvider>
  );
}
