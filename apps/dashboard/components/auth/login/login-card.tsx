'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  LockIcon,
  MailIcon
} from '@humaner/shared/icons';
import GitHubLogo from 'public/github-logo.svg';
import GoogleLogo from 'public/google-logo.svg';
import { toast } from 'sonner';

import { continueWithGitHub } from '@/actions/auth/continue-with-github';
import { continueWithGoogle } from '@/actions/auth/continue-with-google';
import { logIn } from '@/actions/auth/log-in';
import {
  authDividerClassName,
  authInputAdornmentClassName,
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
  authMutedTextClassName,
  authOutlineButtonClassName,
  authHighlightButtonClassName,
  glassAlertDestructiveClassName,
  glassDestructiveMessageClassName,
  glassHeadingClassName
} from '@/components/auth/auth-form-styles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { InputPassword } from '@/components/ui/input-password';
import { InputWithAdornments } from '@/components/ui/input-with-adornments';
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { AuthErrorCode, authErrorMessages } from '@/lib/auth/errors';
import { cn } from '@/lib/utils';
import {
  passThroughlogInSchema,
  type PassThroughLogInSchema
} from '@/schemas/auth/log-in-schema';

export function LoginCard(): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<
    string | undefined
  >();
  const methods = useZodForm({
    schema: passThroughlogInSchema,
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const canSubmit = !isLoading && !methods.formState.isSubmitting;
  const onSubmit = async (values: PassThroughLogInSchema): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    const result = await logIn(values);

    if (result?.validationErrors?._errors) {
      const errorCode = result.validationErrors._errors[0] as AuthErrorCode;

      setUnverifiedEmail(
        errorCode === AuthErrorCode.UnverifiedEmail ? values.email : undefined
      );
      setErrorMessage(
        authErrorMessages[
          errorCode in authErrorMessages
            ? errorCode
            : AuthErrorCode.UnknownError
        ]
      );

      setIsLoading(false);
    } else if (result?.serverError) {
      setUnverifiedEmail(undefined);
      setErrorMessage(result.serverError);
      setIsLoading(false);
    }
  };
  const handleSignInWithGoogle = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    const result = await continueWithGoogle();
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't continue with Google");
    }
    setIsLoading(false);
  };
  const handleSignInWithGitHub = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    const result = await continueWithGitHub();
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't continue with GitHub");
    }
    setIsLoading(false);
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className={cn(glassHeadingClassName, 'text-4xl')}>
          Welcome
        </h1>
        <p className={authMutedTextClassName}>
          Enter your details below to sign into your account.
        </p>
      </div>

      <FormProvider {...methods}>
        <form
          className="flex flex-col gap-4"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormField
            control={methods.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className={authLabelClassName}>Email</FormLabel>
                <FormControl>
                  <InputWithAdornments
                    {...field}
                    type="email"
                    maxLength={255}
                    autoCapitalize="off"
                    autoComplete="username"
                    placeholder="Enter your email address"
                    className={authInputClassName}
                    startAdornment={
                      <MailIcon
                        className={cn('size-4 shrink-0', authInputAdornmentClassName)}
                      />
                    }
                    disabled={methods.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage className={glassDestructiveMessageClassName} />
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="password"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <div className="flex flex-row items-center justify-between">
                  <FormLabel className={authLabelClassName}>Password</FormLabel>
                  <Link
                    href={Routes.ForgotPassword}
                    className={authLinkClassName}
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <InputPassword
                    {...field}
                    maxLength={72}
                    autoCapitalize="off"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={authInputClassName}
                    startAdornment={
                      <LockIcon
                        className={cn('size-4 shrink-0', authInputAdornmentClassName)}
                      />
                    }
                    disabled={methods.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage className={glassDestructiveMessageClassName} />
              </FormItem>
            )}
          />
          {errorMessage && (
            <Alert
              variant="destructive"
              className={glassAlertDestructiveClassName}
            >
              <div className="flex flex-row items-center gap-2">
                <AlertCircleIcon className="size-[18px] shrink-0" />
                <AlertDescription>
                  {errorMessage}
                  {unverifiedEmail && (
                    <Link
                      className={cn(
                        buttonVariants({ variant: 'link' }),
                        'ml-0.5 h-fit gap-0.5 px-0.5 py-0 text-red-800 underline'
                      )}
                      href={`${Routes.VerifyEmail}?email=${encodeURIComponent(unverifiedEmail)}`}
                    >
                      Verify email
                      <ArrowRightIcon className="size-3 shrink-0" />
                    </Link>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
          <Button
            type="submit"
            variant="ghost"
            className={authHighlightButtonClassName}
            disabled={!canSubmit}
            loading={methods.formState.isSubmitting}
            onClick={methods.handleSubmit(onSubmit)}
          >
            Log in
          </Button>
        </form>
      </FormProvider>

      <p className={authDividerClassName}>or</p>

      <div className="flex flex-row gap-4">
        <Button
          type="button"
          variant="ghost"
          className={authOutlineButtonClassName}
          disabled={!canSubmit}
          onClick={handleSignInWithGoogle}
        >
          <GoogleLogo
            width="20"
            height="20"
          />
          Google
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={authOutlineButtonClassName}
          disabled={!canSubmit}
          onClick={handleSignInWithGitHub}
        >
          <GitHubLogo
            width="20"
            height="20"
            className="opacity-90"
          />
          GitHub
        </Button>
      </div>

      <div className="space-y-3 pt-2">
        <p className={cn(authMutedTextClassName, 'text-center')}>
          Don&apos;t have an account?
        </p>
        <Button
          type="button"
          variant="ghost"
          className={authOutlineButtonClassName}
          asChild
        >
          <Link href={Routes.SignUp}>Create account</Link>
        </Button>
      </div>
    </div>
  );
}
