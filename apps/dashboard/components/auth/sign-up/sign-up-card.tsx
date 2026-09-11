'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ctaPrimaryOnLightClassName,
  ctaSecondaryOnLightClassName
} from '@humaner/shared/cta';
import { AlertCircleIcon } from '@humaner/shared/icons';
import { getPrivacyUrl } from '@humaner/shared/urls';
import GitHubLogo from 'public/github-logo.svg';
import GoogleLogo from 'public/google-logo.svg';
import { type SubmitHandler } from 'react-hook-form';

import { continueWithGitHub } from '@/actions/auth/continue-with-github';
import { continueWithGoogle } from '@/actions/auth/continue-with-google';
import { setSignupIntent } from '@/actions/auth/set-signup-intent';
import { signUp } from '@/actions/auth/sign-up';
import {
  authAlertDestructiveClassName,
  authDestructiveMessageClassName,
  authDividerClassName,
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
  authMutedTextClassName,
  authOutlineButtonClassName,
  authPageTitleClassName,
  authPrimaryButtonClassName
} from '@/components/auth/auth-form-styles';
import { useAuthTheme } from '@/components/auth/auth-theme-context';
import { PasswordRequirementList } from '@/components/auth/password-requirement-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputPassword } from '@/components/ui/input-password';
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  signUpSchema,
  type SignUpIntent,
  type SignUpSchema
} from '@/schemas/auth/sign-up-schema';

const pillButtonClassNameCloud =
  'relative min-h-9 flex-1 rounded-none border-0 px-2 py-2 font-mono text-[11px] font-medium tracking-normal outline-none transition-colors focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#e0e1df]/40 sm:min-h-10 sm:text-xs';

const pillButtonClassNameOss =
  'relative min-h-9 flex-1 rounded-[0.5rem] border-0 px-2 py-2 font-sans text-xs font-medium normal-case outline-none transition-colors focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-[#0A0D0D]/20 sm:min-h-10';

export type SignUpCardProps = {
  initialIntent?: SignUpIntent;
  invitationId?: string;
  invitationEmail?: string;
  organizationName?: string;
  lockIntent?: boolean;
};

export function SignUpCard({
  initialIntent = 'business_owner',
  invitationId,
  invitationEmail,
  organizationName,
  lockIntent = false
}: SignUpCardProps): React.JSX.Element {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const methods = useZodForm({
    schema: signUpSchema,
    mode: 'onSubmit',
    defaultValues: {
      intent: invitationId ? 'team_member' : initialIntent,
      invitationId: invitationId ?? '',
      name: '',
      email: invitationEmail ?? '',
      password: ''
    }
  });
  const password = methods.watch('password');
  const intent = methods.watch('intent') ?? 'business_owner';
  const emailLocked = Boolean(invitationEmail);
  const inverted = intent === 'team_member';
  const { setAppearance } = useAuthTheme();

  React.useLayoutEffect(() => {
    setAppearance(inverted ? 'light' : 'dark');
    return () => setAppearance('dark');
  }, [inverted, setAppearance]);

  const persistIntent = async (next: SignUpIntent): Promise<void> => {
    await setSignupIntent({
      intent: next,
      invitationId: invitationId ?? ''
    });
  };

  React.useEffect(() => {
    void persistIntent(intent);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed cookie once on mount / intent change
  }, [intent]);

  const onSubmit: SubmitHandler<SignUpSchema> = async (values) => {
    const result = await signUp(values);
    if (result?.data?.redirectTo) {
      router.push(result.data.redirectTo);
      return;
    }
    if (result?.serverError || result?.validationErrors) {
      if (result.validationErrors?.email?._errors?.[0]) {
        setErrorMessage(result.validationErrors?.email?._errors?.[0]);
      } else if (result.validationErrors?.invitationId?._errors?.[0]) {
        setErrorMessage(result.validationErrors.invitationId._errors[0]);
      } else {
        setErrorMessage('An error occured during sign up.');
      }
    }
  };
  const handleSignInWithGoogle = async (): Promise<void> => {
    await persistIntent(intent);
    const result = await continueWithGoogle();
    if (result?.data?.redirectTo) {
      window.location.assign(result.data.redirectTo);
      return;
    }
    if (result?.serverError || result?.validationErrors) {
      setErrorMessage('An error occured during Google sign in.');
    }
  };
  const handleSignInWithGitHub = async (): Promise<void> => {
    await persistIntent(intent);
    const result = await continueWithGitHub();
    if (result?.data?.redirectTo) {
      window.location.assign(result.data.redirectTo);
      return;
    }
    if (result?.serverError || result?.validationErrors) {
      setErrorMessage('An error occured during GitHub sign in.');
    }
  };

  const oss = false; // Humaner brand chrome
  const titleClassName = cn(
    authPageTitleClassName,
    'transition-colors duration-300',
    inverted && 'text-[#0A0D0D]'
  );
  const mutedClassName = cn(
    authMutedTextClassName,
    'transition-colors duration-300',
    inverted && 'text-[#0A0D0D]/50'
  );
  const linkClassName = cn(
    authLinkClassName,
    inverted && 'text-[#0A0D0D]/50 hover:text-[#0A0D0D]'
  );
  const labelClassName = cn(
    authLabelClassName,
    inverted && 'text-[#0A0D0D]/65'
  );
  const inputClassName = cn(
    authInputClassName,
    inverted &&
      'border-[#0A0D0D]/[0.08] bg-[#0A0D0D]/[0.03] text-[#0A0D0D] placeholder:text-[#0A0D0D]/35 selection:text-[#0A0D0D]'
  );
  const primaryButtonClassName = inverted
    ? `${ctaPrimaryOnLightClassName} h-11 w-full`
    : authPrimaryButtonClassName;
  const outlineButtonClassName = inverted
    ? `${ctaSecondaryOnLightClassName} h-11 w-full`
    : authOutlineButtonClassName;
  const dividerClassName = inverted
    ? 'flex items-center gap-x-3 font-mono text-xs text-[#0A0D0D]/30 before:h-px before:flex-1 before:bg-[#0A0D0D]/[0.08] after:h-px after:flex-1 after:bg-[#0A0D0D]/[0.08]'
    : authDividerClassName;
  const destructiveClassName = inverted
    ? 'text-red-600'
    : authDestructiveMessageClassName;
  const alertClassName = inverted
    ? 'border-red-500/25 bg-red-500/[0.08] text-red-700'
    : authAlertDestructiveClassName;

  return (
    <div className={cn('flex flex-col', oss ? 'gap-4' : 'gap-6')}>
      <div className={cn('text-center', oss ? 'space-y-1' : 'space-y-2')}>
        <h1 className={titleClassName}>
          {oss ? 'Create an account' : 'Humaner'}
        </h1>
        <p className={mutedClassName}>
          {organizationName
            ? `Join ${organizationName}`
            : 'Already have an account?'}{' '}
          {!organizationName ? (
            <Link
              href={Routes.Login}
              className={linkClassName}
            >
              Log in
            </Link>
          ) : null}
        </p>
      </div>

      <div
        className={
          oss
            ? 'flex gap-1 rounded-[0.5rem] border border-[#eaeaea] bg-[#f2f2f2] p-1'
            : inverted
              ? 'flex rounded-lg border border-[#0A0D0D]/[0.08] bg-[#0A0D0D]/[0.04]'
              : 'flex rounded-lg border border-white/[0.08] bg-white/[0.04]'
        }
        role="group"
        aria-label="Account type"
      >
        {(
          [
            { value: 'business_owner', label: 'Business owner' },
            { value: 'team_member', label: 'Team member' }
          ] as const
        ).map((option, index) => {
          const selected = intent === option.value;
          const disabled =
            lockIntent ||
            (Boolean(invitationId) && option.value === 'business_owner');
          return (
            <React.Fragment key={option.value}>
              {index > 0 && !oss ? (
                <div
                  className={
                    inverted
                      ? 'w-px shrink-0 bg-[#0A0D0D]/[0.08]'
                      : 'w-px shrink-0 bg-white/[0.08]'
                  }
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  methods.setValue('intent', option.value, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
                className={cn(
                  oss ? pillButtonClassNameOss : pillButtonClassNameCloud,
                  oss
                    ? selected
                      ? 'bg-[#0A0D0D] text-white shadow-sm'
                      : 'bg-transparent text-[#18181b]/70 hover:text-[#0A0D0D]'
                    : inverted
                      ? selected
                        ? 'bg-[#0A0D0D] text-[#fcf4ec] hover:bg-[#0A0D0D] hover:text-[#fcf4ec]'
                        : 'bg-transparent text-[#0A0D0D]/40 hover:bg-[#0A0D0D]/[0.06] hover:text-[#0A0D0D]/70'
                      : selected
                        ? 'bg-[#fcf4ec] text-[#0A0D0D] hover:bg-white hover:text-[#0A0D0D]'
                        : 'bg-transparent text-white/40 hover:bg-white/[0.06] hover:text-white/70',
                  disabled && !selected && 'cursor-not-allowed opacity-40'
                )}
              >
                {option.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <p
        className={cn(
          mutedClassName,
          'text-center text-xs',
          oss && 'text-[#18181b]/70'
        )}
      >
        {intent === 'team_member'
          ? invitationId
            ? 'Create your account to accept the invitation.'
            : 'Create an account, then request access with a workspace ID.'
          : 'Create a workspace for your business and invite your team.'}
      </p>

      <FormProvider {...methods}>
        <form
          className="flex flex-col gap-4"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <input
            type="hidden"
            {...methods.register('intent')}
          />
          <input
            type="hidden"
            {...methods.register('invitationId')}
          />
          <FormField
            control={methods.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col">
                <FormLabel className={labelClassName}>Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    maxLength={64}
                    autoComplete="name"
                    placeholder="Enter your name"
                    className={inputClassName}
                    disabled={methods.formState.isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage className={destructiveClassName} />
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col">
                <FormLabel className={labelClassName}>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    maxLength={255}
                    autoComplete="username"
                    placeholder="Enter your email address"
                    className={inputClassName}
                    disabled={methods.formState.isSubmitting || emailLocked}
                    {...field}
                  />
                </FormControl>
                <FormMessage className={destructiveClassName} />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-3">
            <FormField
              control={methods.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={labelClassName}>Password</FormLabel>
                  <FormControl>
                    <InputPassword
                      maxLength={72}
                      autoCapitalize="off"
                      autoComplete="new-password"
                      placeholder="Enter your password"
                      className={inputClassName}
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className={destructiveClassName} />
                </FormItem>
              )}
            />
            <PasswordRequirementList
              password={password}
              inverted={inverted}
            />
          </div>
          {errorMessage && (
            <Alert
              variant="destructive"
              className={alertClassName}
            >
              <div className="flex flex-row items-center gap-2 text-sm">
                <AlertCircleIcon className="size-[18px] shrink-0" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </div>
            </Alert>
          )}
          <Button
            type="submit"
            variant="ghost"
            className={primaryButtonClassName}
            disabled={methods.formState.isSubmitting}
            loading={methods.formState.isSubmitting}
          >
            Create account
          </Button>
        </form>
      </FormProvider>

      <p className={dividerClassName}>or</p>

      <div className="flex flex-row gap-3">
        <Button
          type="button"
          variant="ghost"
          aria-label="Continue with Google"
          className={cn(outlineButtonClassName, 'flex-1')}
          disabled={methods.formState.isSubmitting}
          onClick={() => void handleSignInWithGoogle()}
        >
          <GoogleLogo
            width="20"
            height="20"
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label="Continue with GitHub"
          className={cn(outlineButtonClassName, 'flex-1')}
          disabled={methods.formState.isSubmitting}
          onClick={() => void handleSignInWithGitHub()}
        >
          <GitHubLogo
            width="20"
            height="20"
          />
        </Button>
      </div>

      <p className={cn(mutedClassName, 'text-center text-xs leading-relaxed')}>
        By signing up, you agree to our{' '}
        <Link
          href="#"
          className={linkClassName}
        >
          Terms of Use
        </Link>{' '}
        and{' '}
        <Link
          href={getPrivacyUrl()}
          className={linkClassName}
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
