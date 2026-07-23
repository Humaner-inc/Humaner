'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  LockIcon
} from '@humaner/shared/icons';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

import { submitTotpCode } from '@/actions/auth/submit-totp-code';
import {
  authAlertDestructiveClassName,
  authDestructiveMessageClassName,
  authHeadingClassName,
  authLinkClassName,
  authMutedTextClassName,
  authOtpSlotClassName,
  authPrimaryButtonClassName
} from '@/components/auth/auth-form-styles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { AuthErrorCode, authErrorMessages } from '@/lib/auth/errors';
import { cn } from '@/lib/utils';
import {
  submitTotpCodeSchema,
  type SubmitTotpCodeSchema
} from '@/schemas/auth/submit-totp-code-schema';

export type TotpCodeCardProps = {
  token: string;
  expiry: string;
};

export function TotpCodeCard({
  token,
  expiry
}: TotpCodeCardProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [errorCode, setErrorCode] = React.useState<AuthErrorCode>();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const methods = useZodForm({
    schema: submitTotpCodeSchema,
    mode: 'onSubmit',
    defaultValues: {
      token,
      expiry,
      totpCode: ''
    }
  });
  const canSubmit =
    !isLoading && !submitSuccess && !methods.formState.isSubmitting;

  const onSubmit = async (values: SubmitTotpCodeSchema): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    setSubmitSuccess(false);
    setErrorMessage(undefined);

    const result = await submitTotpCode(values);

    if (result?.validationErrors?._errors) {
      const nextErrorCode = result.validationErrors._errors[0] as AuthErrorCode;
      setErrorCode(nextErrorCode);
      setErrorMessage(
        authErrorMessages[
          nextErrorCode in authErrorMessages
            ? nextErrorCode
            : AuthErrorCode.UnknownError
        ]
      );
      setIsLoading(false);
      return;
    }

    if (result?.serverError) {
      setErrorCode(undefined);
      setErrorMessage(result.serverError);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setSubmitSuccess(true);

    const redirectTo = result?.data?.redirectTo ?? Routes.Home;
    await new Promise((resolve) => {
      window.setTimeout(resolve, 450);
    });
    window.location.assign(redirectTo);
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-2 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#e1ccaf]/80">
          Two-factor
        </p>
        <h1 className={cn(authHeadingClassName, 'text-3xl sm:text-4xl')}>
          Authenticator code
        </h1>
        <p className={cn(authMutedTextClassName, 'text-center')}>
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      <FormProvider {...methods}>
        <form
          className="flex flex-col items-center gap-6"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <input
            type="hidden"
            className="hidden"
            disabled={methods.formState.isSubmitting}
            {...methods.register('token')}
          />
          <input
            type="hidden"
            className="hidden"
            disabled={methods.formState.isSubmitting}
            {...methods.register('expiry')}
          />

          <div className="flex w-fit flex-col gap-5">
            <FormField
              control={methods.control}
              name="totpCode"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col items-center space-y-2">
                  <FormControl>
                    <InputOTP
                      {...field}
                      inputMode="numeric"
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      disabled={isLoading || submitSuccess}
                      onComplete={methods.handleSubmit(onSubmit)}
                    >
                      <InputOTPGroup className="justify-center gap-2.5">
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className={cn(
                              authOtpSlotClassName,
                              'font-mono tracking-wide ring-[#e1ccaf]/40'
                            )}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage className={authDestructiveMessageClassName} />
                </FormItem>
              )}
            />

            {errorMessage ? (
              <Alert
                variant="destructive"
                className={authAlertDestructiveClassName}
              >
                <div className="flex flex-row items-center gap-2">
                  <AlertCircleIcon className="size-[18px] shrink-0" />
                  <AlertDescription>
                    {errorMessage}
                    {errorCode === AuthErrorCode.RequestExpired ? (
                      <Link
                        className={cn(
                          buttonVariants({ variant: 'link' }),
                          'ml-0.5 h-fit gap-0.5 px-0.5 py-0 text-red-300 underline'
                        )}
                        href={Routes.Login}
                      >
                        Log in again.
                        <ArrowRightIcon className="size-3 shrink-0" />
                      </Link>
                    ) : null}
                  </AlertDescription>
                </div>
              </Alert>
            ) : null}

            <Button
              type="submit"
              variant="ghost"
              className={authPrimaryButtonClassName}
              disabled={!canSubmit}
              loading={isLoading}
            >
              {submitSuccess ? (
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
      </FormProvider>

      <div className="flex items-center justify-center gap-5">
        <Link
          href={Routes.Login}
          className={cn(
            buttonVariants({ variant: 'link', size: 'default' }),
            authLinkClassName,
            'hover:no-underline'
          )}
        >
          <ArrowLeftIcon className="mr-2 size-4 shrink-0" />
          Go back
        </Link>
        <Link
          href={`${Routes.RecoveryCode}?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`}
          className={cn(
            buttonVariants({ variant: 'link', size: 'default' }),
            authLinkClassName,
            'hover:no-underline'
          )}
        >
          <LockIcon className="mr-2 size-4 shrink-0" />
          Lost access
        </Link>
      </div>
    </div>
  );
}
