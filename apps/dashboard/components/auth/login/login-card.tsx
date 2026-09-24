'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ctaPrimaryOnLightClassName,
  ctaSecondaryOnLightClassName
} from '@humaner/shared/cta';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
  MailIcon
} from '@humaner/shared/icons';
import { assignTrustedNavigation } from '@humaner/shared/urls';
import GitHubLogo from 'public/github-logo.svg';
import GoogleLogo from 'public/google-logo.svg';
import { toast } from 'sonner';

import { continueWithGitHub } from '@/actions/auth/continue-with-github';
import { continueWithGoogle } from '@/actions/auth/continue-with-google';
import { logIn } from '@/actions/auth/log-in';
import {
  authAlertDestructiveClassName,
  authDestructiveMessageClassName,
  authHighlightButtonClassName,
  authInputAdornmentClassName,
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
  authMutedTextClassName,
  authOutlineButtonClassName,
  authPageTitleClassName,
  authStackButtonClassName,
  authStackInputClassName
} from '@/components/auth/auth-form-styles';
import { useAuthTheme } from '@/components/auth/auth-theme-context';
import { SignUpCard } from '@/components/auth/sign-up/sign-up-card';
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
import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { AuthErrorCode, authErrorMessages } from '@/lib/auth/errors';
import { getSignedInHomePath } from '@/lib/routes/signed-in-home';
import { cn } from '@/lib/utils';
import {
  passThroughlogInSchema,
  type PassThroughLogInSchema
} from '@/schemas/auth/log-in-schema';

export type LoginCardProps = {
  /** Auth.js redirects here with ?error=… (e.g. OAuthAccountNotLinked). */
  initialErrorMessage?: string;
};

export function LoginCard({
  initialErrorMessage
}: LoginCardProps = {}): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(
    initialErrorMessage
  );
  const [highlightInputs, setHighlightInputs] = React.useState(false);
  const [authPage, setAuthPage] = React.useState<'1' | '2' | '3'>('1');
  const showEmailForm = authPage === '2';
  const showSignupForm = authPage === '3';
  const { isInverted, setAppearance } = useAuthTheme();
  const goToMethods = (): void => {
    setAppearance('dark');
    setAuthPage('1');
  };
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<
    string | undefined
  >();
  const highlightTimeoutRef = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const methods = useZodForm({
    schema: passThroughlogInSchema,
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const canSubmit = !isLoading && !loginSuccess;

  React.useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const pulseInputs = (): void => {
    setHighlightInputs(false);
    window.requestAnimationFrame(() => {
      setHighlightInputs(true);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightInputs(false);
      }, 550);
    });
  };

  const onSubmit = async (values: PassThroughLogInSchema): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    setLoginSuccess(false);
    setErrorMessage(undefined);
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
      return;
    }

    if (result?.serverError) {
      setUnverifiedEmail(undefined);
      setErrorMessage(result.serverError);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setLoginSuccess(true);

    const redirectTo = result?.data?.redirectTo ?? getSignedInHomePath();
    await new Promise((resolve) => {
      window.setTimeout(resolve, 550);
    });
    // Full navigation so the session cookie from the server action is applied
    // before protected middleware runs (router.push can race).
    assignTrustedNavigation(redirectTo);
  };
  const handleSignInWithGoogle = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    const result = await continueWithGoogle();
    if (
      result?.data?.redirectTo &&
      assignTrustedNavigation(result.data.redirectTo)
    ) {
      return;
    }
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
    if (
      result?.data?.redirectTo &&
      assignTrustedNavigation(result.data.redirectTo)
    ) {
      return;
    }
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't continue with GitHub");
    }
    setIsLoading(false);
  };
  const oss = false; // Humaner brand chrome
  const methodButtonClassName = cn(
    isInverted
      ? `${ctaSecondaryOnLightClassName} h-11 w-full`
      : authOutlineButtonClassName,
    authStackButtonClassName,
    'justify-center gap-2.5'
  );
  const primaryButtonClassName = cn(
    isInverted
      ? `${ctaPrimaryOnLightClassName} h-11 w-full`
      : authHighlightButtonClassName,
    authStackButtonClassName,
    'justify-center gap-2.5'
  );

  return (
    <div className={cn('flex flex-col', oss ? 'gap-4' : 'gap-6')}>
      <div className={cn('text-center', oss ? 'space-y-1' : 'space-y-2')}>
        <h1
          className={cn(
            authPageTitleClassName,
            'transition-colors duration-300',
            isInverted && 'text-[#0A0D0D]'
          )}
        >
          {oss ? 'Log in' : AppInfo.APP_NAME}
        </h1>
        {showSignupForm ? null : (
          <p
            className={cn(
              authMutedTextClassName,
              'transition-colors duration-300',
              isInverted && 'text-[#0A0D0D]/50'
            )}
          >
            {showEmailForm
              ? 'Enter your details below to sign into your account.'
              : 'Log in to your account.'}
          </p>
        )}
      </div>

      {errorMessage && authPage === '1' ? (
        <Alert
          variant="destructive"
          className={authAlertDestructiveClassName}
        >
          <div className="flex flex-row items-center gap-2">
            <AlertCircleIcon className="size-[18px] shrink-0" />
            <AlertDescription>
              {errorMessage}
              {unverifiedEmail ? (
                <Link
                  className={cn(
                    buttonVariants({ variant: 'link' }),
                    'ml-0.5 h-fit gap-0.5 px-0.5 py-0 underline',
                    oss ? 'text-foreground' : 'text-red-300'
                  )}
                  href={`${Routes.VerifyEmail}?email=${encodeURIComponent(unverifiedEmail)}`}
                >
                  Verify email
                  <ArrowRightIcon className="size-3 shrink-0" />
                </Link>
              ) : null}
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <div
        className={cn(
          't-page-slide t-resize overflow-hidden',
          showSignupForm
            ? 'h-[min(38rem,72vh)]'
            : showEmailForm
              ? 'h-[20rem]'
              : 'h-[10.25rem]'
        )}
        data-page={authPage}
      >
        <section
          className="t-page flex flex-col justify-start"
          data-page-id="1"
        >
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="ghost"
              className={primaryButtonClassName}
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
              className={methodButtonClassName}
              disabled={!canSubmit}
              onClick={handleSignInWithGitHub}
            >
              <GitHubLogo
                width="20"
                height="20"
              />
              GitHub
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={methodButtonClassName}
              disabled={!canSubmit}
              onClick={() => setAuthPage('2')}
            >
              With email
            </Button>
          </div>
        </section>

        <section
          className="t-page flex flex-col justify-start overflow-y-auto"
          data-page-id="2"
        >
          <FormProvider {...methods}>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                pulseInputs();
                void methods.handleSubmit(onSubmit)(event);
              }}
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
                        className={cn(
                          authInputClassName,
                          authStackInputClassName,
                          highlightInputs && 'auth-input--highlight'
                        )}
                        startAdornment={
                          <MailIcon
                            className={cn(
                              'size-4 shrink-0',
                              authInputAdornmentClassName
                            )}
                          />
                        }
                        disabled={isLoading || loginSuccess}
                      />
                    </FormControl>
                    <FormMessage className={authDestructiveMessageClassName} />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <FormLabel className={authLabelClassName}>
                        Password
                      </FormLabel>
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
                        className={cn(
                          authInputClassName,
                          authStackInputClassName,
                          highlightInputs && 'auth-input--highlight'
                        )}
                        startAdornment={
                          <LockIcon
                            className={cn(
                              'size-4 shrink-0',
                              authInputAdornmentClassName
                            )}
                          />
                        }
                        disabled={isLoading || loginSuccess}
                      />
                    </FormControl>
                    <FormMessage className={authDestructiveMessageClassName} />
                  </FormItem>
                )}
              />
              {errorMessage && showEmailForm ? (
                <Alert
                  variant="destructive"
                  className={authAlertDestructiveClassName}
                >
                  <div className="flex flex-row items-center gap-2">
                    <AlertCircleIcon className="size-[18px] shrink-0" />
                    <AlertDescription>
                      {errorMessage}
                      {unverifiedEmail ? (
                        <Link
                          className={cn(
                            buttonVariants({ variant: 'link' }),
                            'ml-0.5 h-fit gap-0.5 px-0.5 py-0 underline',
                            oss ? 'text-foreground' : 'text-red-300'
                          )}
                          href={`${Routes.VerifyEmail}?email=${encodeURIComponent(unverifiedEmail)}`}
                        >
                          Verify email
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
                className={primaryButtonClassName}
                disabled={!canSubmit}
                loading={isLoading}
              >
                {loginSuccess ? (
                  <CheckIcon
                    className="size-4"
                    strokeWidth={2.5}
                  />
                ) : (
                  'Log in'
                )}
              </Button>
              <button
                type="button"
                className={cn(authLinkClassName, 'self-center')}
                onClick={goToMethods}
              >
                Back
              </button>
            </form>
          </FormProvider>
        </section>

        <section
          className="t-page flex flex-col justify-start overflow-y-auto"
          data-page-id="3"
        >
          <SignUpCard
            embedded
            active={showSignupForm}
            onBackToLogin={goToMethods}
          />
        </section>
      </div>

      {showSignupForm ? null : (
        <div className="space-y-3">
          <p
            className={cn(
              authMutedTextClassName,
              'text-center transition-colors duration-300',
              isInverted && 'text-[#0A0D0D]/50'
            )}
          >
            Don&apos;t have an account?
          </p>
          <Button
            type="button"
            variant="ghost"
            className={cn(methodButtonClassName)}
            onClick={() => setAuthPage('3')}
          >
            Create account
          </Button>
        </div>
      )}
    </div>
  );
}
