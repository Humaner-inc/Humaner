'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@humaner/shared/icons';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { resendEmailConfirmation } from '@/actions/auth/resend-email-confirmation';
import { verifyEmailWithOtp } from '@/actions/auth/verify-email-with-otp';
import {
  authOnboardingDestructiveClassName,
  authOnboardingHeadingClassName,
  authOnboardingLinkClassName,
  authOnboardingMutedClassName,
  authOnboardingOtpSlotClassName,
  authOnboardingPrimaryButtonClassName
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
import { useZodForm } from '@/hooks/use-zod-form';
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
  const router = useRouter();
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
      otp: ''
    }
  });
  const isVerifying = methods.formState.isSubmitting;
  const canSubmit = !isVerifying && !verifySuccess;

  const onSubmit: SubmitHandler<VerifyEmailWithOtpSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await verifyEmailWithOtp(values);
    if (result?.data?.redirectTo) {
      setVerifySuccess(true);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 550);
      });
      router.push(result.data.redirectTo);
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
          <h1 className={authOnboardingHeadingClassName}>Verify your email</h1>
          <p className={authOnboardingMutedClassName}>
            {email ? (
              <>
                Enter the code we sent to{' '}
                <span className="font-medium text-[#070607]">{email}</span>.
              </>
            ) : (
              'Enter the code we sent to your inbox.'
            )}
          </p>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormField
            control={methods.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col items-center space-y-2">
                <FormControl>
                  <InputOTP
                    {...field}
                    inputMode="text"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                    disabled={isVerifying || verifySuccess}
                    onComplete={methods.handleSubmit(onSubmit)}
                  >
                    <InputOTPGroup className="justify-center gap-2.5">
                      <InputOTPSlot
                        index={0}
                        className={cn(
                          authOnboardingOtpSlotClassName,
                          'ring-[#dc143c]/40'
                        )}
                      />
                      <InputOTPSlot
                        index={1}
                        className={cn(
                          authOnboardingOtpSlotClassName,
                          'ring-[#dc143c]/40'
                        )}
                      />
                      <InputOTPSlot
                        index={2}
                        className={cn(
                          authOnboardingOtpSlotClassName,
                          'ring-[#dc143c]/40'
                        )}
                      />
                      <InputOTPSlot
                        index={3}
                        className={cn(
                          authOnboardingOtpSlotClassName,
                          'ring-[#dc143c]/40'
                        )}
                      />
                      <InputOTPSlot
                        index={4}
                        className={cn(
                          authOnboardingOtpSlotClassName,
                          'ring-[#dc143c]/40'
                        )}
                      />
                      <InputOTPSlot
                        index={5}
                        className={cn(
                          authOnboardingOtpSlotClassName,
                          'ring-[#dc143c]/40'
                        )}
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage className={authOnboardingDestructiveClassName} />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="ghost"
            className={authOnboardingPrimaryButtonClassName}
            disabled={!canSubmit}
            loading={isVerifying}
          >
            {verifySuccess ? (
              <CheckIcon className="size-4" strokeWidth={2.5} />
            ) : (
              'Verify'
            )}
          </Button>
        </form>

        <p className={cn('text-center', authOnboardingMutedClassName)}>
          Didn&apos;t receive an email?{' '}
          <button
            type="button"
            className={cn(
              authOnboardingLinkClassName,
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
