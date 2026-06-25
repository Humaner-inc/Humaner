'use client';

import * as React from 'react';
import Link from 'next/link';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LockIcon
} from 'lucide-react';

import { submitTotpCode } from '@/actions/auth/submit-totp-code';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { AuthErrorCode, authErrorMessages } from '@/lib/auth/errors';
import { cn } from '@/lib/utils';
import {
  submitTotpCodeSchema,
  type SubmitTotpCodeSchema
} from '@/schemas/auth/submit-totp-code-schema';

export type TotpCodeCardProps = CardProps & {
  token: string;
  expiry: string;
};

export function TotpCodeCard({
  token,
  expiry,
  ...other
}: TotpCodeCardProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
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
  const canSubmit = !isLoading && !methods.formState.isSubmitting;
  const onSubmit = async (values: SubmitTotpCodeSchema): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);

    const result = await submitTotpCode(values);

    if (result?.validationErrors?._errors) {
      const errorCode = result.validationErrors._errors[0] as AuthErrorCode;
      setErrorCode(errorCode);
      setErrorMessage(
        authErrorMessages[
          errorCode in authErrorMessages
            ? errorCode
            : AuthErrorCode.UnknownError
        ]
      );

      setIsLoading(false);
    } else if (result?.serverError) {
      setErrorCode(undefined);
      setErrorMessage(result.serverError);
      setIsLoading(false);
    }
  };

  return (
    <Card {...other}>
      <CardHeader>
        <CardTitle>Authenticator code</CardTitle>
        <CardDescription>
          Please enter the 6-digit code from your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <FormField
              control={methods.control}
              name="totpCode"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col items-center space-y-0">
                  <FormControl>
                    <InputOTP
                      {...field}
                      inputMode="numeric"
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      disabled={methods.formState.isSubmitting}
                      onComplete={methods.handleSubmit(onSubmit)}
                      containerClassName="w-full"
                    >
                      <InputOTPGroup className="w-full justify-between">
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="size-12 rounded-md border"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <Alert variant="destructive">
                <div className="flex flex-row items-center gap-2">
                  <AlertCircleIcon className="size-[18px] shrink-0" />
                  <AlertDescription>
                    {errorMessage}
                    {errorCode === AuthErrorCode.RequestExpired && (
                      <Link
                        className={cn(
                          buttonVariants({ variant: 'link' }),
                          'ml-0.5 h-fit gap-0.5 px-0.5 py-0 text-foreground underline'
                        )}
                        href={Routes.Login}
                      >
                        Log in again.
                        <ArrowRightIcon className="size-3 shrink-0" />
                      </Link>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            <Button
              type="submit"
              variant="default"
              className="w-full"
              disabled={!canSubmit}
              loading={methods.formState.isSubmitting}
              onClick={methods.handleSubmit(onSubmit)}
            >
              Submit
            </Button>
          </form>
        </FormProvider>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-center py-2">
        <Link
          href={Routes.Login}
          className={cn(
            buttonVariants({ variant: 'link', size: 'default' }),
            'text-muted-foreground hover:text-primary hover:no-underline'
          )}
        >
          <ArrowLeftIcon className="mr-2 size-4 shrink-0" />
          Go back
        </Link>
        <Link
          href={`${Routes.RecoveryCode}?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`}
          className={cn(
            buttonVariants({ variant: 'link', size: 'default' }),
            'text-muted-foreground hover:text-primary hover:no-underline'
          )}
        >
          <LockIcon className="mr-2 size-4 shrink-0" />
          Lost access
        </Link>
      </CardFooter>
    </Card>
  );
}
