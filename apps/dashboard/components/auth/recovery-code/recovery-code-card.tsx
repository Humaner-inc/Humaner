'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@humaner/shared/icons';

import { submitRecoveryCode } from '@/actions/auth/submit-recovery-code';
import {
  authAlertDestructiveClassName,
  authDestructiveMessageClassName,
  authInputClassName,
  authLinkClassName,
  authMutedTextClassName,
  authPageTitleClassName,
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
import { Input } from '@/components/ui/input';
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { AuthErrorCode, authErrorMessages } from '@/lib/auth/errors';
import { cn } from '@/lib/utils';
import {
  submitRecoveryCodeSchema,
  type SubmitRecoveryCodeSchema
} from '@/schemas/auth/submit-recovery-code-schema';

export type RecoveryCodeCardProps = {
  token: string;
  expiry: string;
};

export function RecoveryCodeCard({
  token,
  expiry
}: RecoveryCodeCardProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorCode, setErrorCode] = React.useState<AuthErrorCode>();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const methods = useZodForm({
    schema: submitRecoveryCodeSchema,
    mode: 'onSubmit',
    defaultValues: {
      token,
      expiry,
      recoveryCode: ''
    }
  });
  const canSubmit = !isLoading && !methods.formState.isSubmitting;
  const oss = false; // Humaner brand chrome

  const onSubmit = async (values: SubmitRecoveryCodeSchema): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);

    const result = await submitRecoveryCode(values);

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

    const redirectTo = result?.data?.redirectTo ?? Routes.Home;
    window.location.assign(redirectTo);
  };

  return (
    <div className={cn('flex w-full flex-col', oss ? 'gap-4' : 'gap-6')}>
      <div className={cn('text-center', oss ? 'space-y-1' : 'space-y-2')}>
        <h1 className={authPageTitleClassName}>Recovery code</h1>
        <p className={authMutedTextClassName}>
          Enter one of your recovery seeds to get your access back.
        </p>
      </div>

      <FormProvider {...methods}>
        <form
          className="flex flex-col gap-4"
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
          <FormField
            control={methods.control}
            name="recoveryCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    disabled={methods.formState.isSubmitting}
                    placeholder="XXXXX-XXXXX"
                    maxLength={11}
                    className={authInputClassName}
                  />
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
                        'ml-0.5 h-fit gap-0.5 px-0.5 py-0 underline',
                        oss ? 'text-destructive' : 'text-red-300'
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
            loading={methods.formState.isSubmitting}
          >
            Submit
          </Button>
        </form>
      </FormProvider>

      <div className="flex justify-center pt-1">
        <Link
          href={`${Routes.Totp}?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`}
          className={cn(
            buttonVariants({ variant: 'link', size: 'default' }),
            authLinkClassName,
            'hover:no-underline'
          )}
        >
          <ArrowLeftIcon className="mr-2 size-4 shrink-0" />
          Go back
        </Link>
      </div>
    </div>
  );
}
