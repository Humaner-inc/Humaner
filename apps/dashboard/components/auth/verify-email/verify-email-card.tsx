'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { resendEmailConfirmation } from '@/actions/auth/resend-email-confirmation';
import { verifyEmailWithOtp } from '@/actions/auth/verify-email-with-otp';
import {
  AuthInnerCard,
  AuthInnerCardContent,
  AuthInnerCardDescription,
  AuthInnerCardFooter,
  AuthInnerCardHeader,
  AuthInnerCardTitle
} from '@/components/auth/auth-inner-card';
import { glassLinkClassName, glassMutedTextClassName } from '@/components/auth/auth-form-styles';
import { Button } from '@/components/ui/button';
import type { CardProps } from '@/components/ui/card';
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

export type VerifyEmailCardProps = CardProps & {
  email: string;
};

export function VerifyEmailCard({
  email,
  ...other
}: VerifyEmailCardProps): React.JSX.Element {
  const router = useRouter();
  // Resend
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
  // Verify with OTP
  const methods = useZodForm({
    schema: verifyEmailWithOtpSchema,
    mode: 'onSubmit',
    defaultValues: {
      otp: ''
    }
  });
  const canSubmit = !methods.formState.isSubmitting;
  const onSubmit: SubmitHandler<VerifyEmailWithOtpSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await verifyEmailWithOtp(values);
    if (result?.data?.redirectTo) {
      router.push(result.data.redirectTo);
      return;
    }
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't verify email");
    }
  };
  return (
    <FormProvider {...methods}>
      <AuthInnerCard {...other}>
        <AuthInnerCardHeader>
          <AuthInnerCardTitle>Verify your email</AuthInnerCardTitle>
          <AuthInnerCardDescription>
            Enter the code we sent to your inbox.
          </AuthInnerCardDescription>
        </AuthInnerCardHeader>
        <AuthInnerCardContent className="mt-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col items-center space-y-0">
                  <FormControl>
                    <InputOTP
                      {...field}
                      inputMode="text"
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                      disabled={methods.formState.isSubmitting}
                      onComplete={methods.handleSubmit(onSubmit)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="default"
              disabled={!canSubmit}
              loading={methods.formState.isSubmitting}
            >
              Verify
            </Button>
          </form>
        </AuthInnerCardContent>
        <AuthInnerCardFooter className={cn('justify-center gap-1 text-sm', glassMutedTextClassName)}>
          Didn't receive an email?
          <Button
            type="button"
            variant="link"
            className={cn('h-fit px-0.5 py-0 underline', glassLinkClassName)}
            disabled={
              methods.formState.isSubmitting || isResendingEmailVerification
            }
            onClick={handleResendEmailVerification}
          >
            Resend
          </Button>
        </AuthInnerCardFooter>
      </AuthInnerCard>
    </FormProvider>
  );
}
