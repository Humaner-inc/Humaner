'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ctaPrimaryOnLightClassName } from '@humaner/shared/cta';
import {
  AlertCircleIcon,
  LockIcon,
  MailIcon,
  UserIcon
} from '@humaner/shared/icons';
import { getPrivacyUrl } from '@humaner/shared/urls';
import { type SubmitHandler } from 'react-hook-form';

import { setSignupIntent } from '@/actions/auth/set-signup-intent';
import { signUp } from '@/actions/auth/sign-up';
import {
  authAlertDestructiveClassName,
  authDestructiveMessageClassName,
  authHighlightButtonClassName,
  authInputAdornmentClassName,
  authInputAdornmentOnLightClassName,
  authInputClassName,
  authInputOnLightClassName,
  authLabelClassName,
  authLinkClassName,
  authMutedTextClassName,
  authPageTitleClassName,
  authStackButtonClassName,
  authStackInputClassName,
  authStackInputOnLightClassName
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
import { InputPassword } from '@/components/ui/input-password';
import { InputWithAdornments } from '@/components/ui/input-with-adornments';
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  signUpSchema,
  type SignUpIntent,
  type SignUpSchema
} from '@/schemas/auth/sign-up-schema';

const pillButtonClassNameCloud =
  'relative z-10 min-h-9 flex-1 rounded-full border-0 px-2 py-2 font-mono text-[11px] font-medium tracking-normal outline-none transition-colors duration-200 focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#e0e1df]/40 sm:min-h-10 sm:text-xs';

const pillButtonClassNameOss =
  'relative z-10 min-h-9 flex-1 rounded-full border-0 px-2 py-2 font-sans text-xs font-medium normal-case outline-none transition-colors duration-200 focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-[#0A0D0D]/20 sm:min-h-10';

export type SignUpCardProps = {
  initialIntent?: SignUpIntent;
  invitationId?: string;
  invitationEmail?: string;
  organizationName?: string;
  lockIntent?: boolean;
  /** Hide the page title when the form slides in from login. */
  embedded?: boolean;
  /** When embedded, only invert the page while this panel is showing. */
  active?: boolean;
  onBackToLogin?: () => void;
};

export function SignUpCard({
  initialIntent = 'business_owner',
  invitationId,
  invitationEmail,
  organizationName,
  lockIntent = false,
  embedded = false,
  active = true,
  onBackToLogin
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
    if (embedded && !active) {
      setAppearance('dark');
      return;
    }
    setAppearance(inverted ? 'light' : 'dark');
    return () => {
      if (embedded) {
        setAppearance('dark');
      }
    };
  }, [active, embedded, inverted, setAppearance]);

  const persistIntent = async (next: SignUpIntent): Promise<void> => {
    await setSignupIntent({
      intent: next,
      invitationId: invitationId ?? ''
    });
  };

  React.useEffect(() => {
    // Login keeps this card mounted while Google/GitHub stay on the methods
    // page. Don't write an account-type cookie until signup is actually open.
    if (embedded && !active) {
      return;
    }
    void persistIntent(intent);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed cookie when the visible intent changes
  }, [active, embedded, intent, invitationId]);

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
    inverted ? authInputOnLightClassName : authInputClassName,
    inverted ? authStackInputOnLightClassName : authStackInputClassName
  );
  const adornmentClassName = inverted
    ? authInputAdornmentOnLightClassName
    : authInputAdornmentClassName;
  const primaryButtonClassName = cn(
    inverted
      ? `${ctaPrimaryOnLightClassName} h-11 w-full`
      : authHighlightButtonClassName,
    authStackButtonClassName,
    'justify-center gap-2.5'
  );
  const destructiveClassName = inverted
    ? 'text-red-600'
    : authDestructiveMessageClassName;
  const alertClassName = inverted
    ? 'border-red-500/25 bg-red-500/[0.08] text-red-700'
    : authAlertDestructiveClassName;

  return (
    <div className={cn('flex flex-col', oss ? 'gap-4' : 'gap-6')}>
      <div className={cn('text-center', oss ? 'space-y-1' : 'space-y-2')}>
        {embedded ? null : (
          <h1 className={titleClassName}>
            {oss ? 'Create an account' : 'Humaner'}
          </h1>
        )}
        <p className={mutedClassName}>
          {organizationName
            ? `Join ${organizationName}'s mailbox`
            : 'Already have an account?'}{' '}
          {!organizationName ? (
            onBackToLogin ? (
              <button
                type="button"
                className={linkClassName}
                onClick={onBackToLogin}
              >
                Log in
              </button>
            ) : (
              <Link
                href={Routes.Login}
                className={linkClassName}
              >
                Log in
              </Link>
            )
          ) : null}
        </p>
      </div>

      <div
        className={cn(
          'auth-intent-pill',
          oss
            ? 'border border-[#eaeaea] bg-[#f2f2f2]'
            : inverted
              ? 'border border-[#0A0D0D]/[0.08] bg-[#0A0D0D]/[0.04]'
              : 'border border-white/[0.08] bg-white/[0.04]'
        )}
        data-intent={intent}
        role="group"
        aria-label="Account type"
      >
        <span
          aria-hidden
          className={cn(
            'auth-intent-pill__thumb',
            oss ? 'bg-[#0A0D0D]' : inverted ? 'bg-[#0A0D0D]' : 'bg-[#fcf4ec]'
          )}
        />
        {(
          [
            { value: 'business_owner', label: 'Business owner' },
            { value: 'team_member', label: 'Team member' }
          ] as const
        ).map((option) => {
          const selected = intent === option.value;
          const disabled =
            lockIntent ||
            (Boolean(invitationId) && option.value === 'business_owner');
          return (
            <React.Fragment key={option.value}>
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
                  'z-10 bg-transparent',
                  oss
                    ? selected
                      ? 'text-white'
                      : 'text-[#18181b]/70 hover:text-[#0A0D0D]'
                    : inverted
                      ? selected
                        ? 'text-[#fcf4ec]'
                        : 'text-[#0A0D0D]/40 hover:text-[#0A0D0D]/70'
                      : selected
                        ? 'text-[#0A0D0D]'
                        : 'text-white/40 hover:text-white/70',
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
            ? 'Create your account to join the mailbox.'
            : 'Create an account, then join the mailbox with a workspace ID.'
          : 'Create the mailbox for your business and invite your team.'}
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
                  <InputWithAdornments
                    type="text"
                    maxLength={64}
                    autoComplete="name"
                    placeholder="Enter your name"
                    className={inputClassName}
                    containerClassName={
                      inverted
                        ? '[&_.auth-input-adornment-slot]:text-[#0A0D0D]/40'
                        : undefined
                    }
                    disabled={methods.formState.isSubmitting}
                    startAdornment={
                      <UserIcon
                        className={cn('size-4 shrink-0', adornmentClassName)}
                      />
                    }
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
                  <InputWithAdornments
                    type="email"
                    maxLength={255}
                    autoComplete="username"
                    placeholder="Enter your email address"
                    className={inputClassName}
                    containerClassName={
                      inverted
                        ? '[&_.auth-input-adornment-slot]:text-[#0A0D0D]/40'
                        : undefined
                    }
                    disabled={methods.formState.isSubmitting || emailLocked}
                    startAdornment={
                      <MailIcon
                        className={cn('size-4 shrink-0', adornmentClassName)}
                      />
                    }
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
                      containerClassName={
                        inverted
                          ? '[&_.auth-input-adornment-slot]:text-[#0A0D0D]/40 [&_button]:text-[#0A0D0D]/40'
                          : undefined
                      }
                      disabled={methods.formState.isSubmitting}
                      startAdornment={
                        <LockIcon
                          className={cn('size-4 shrink-0', adornmentClassName)}
                        />
                      }
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
          {errorMessage ? (
            <Alert
              variant="destructive"
              className={alertClassName}
            >
              <div className="flex flex-row items-center gap-2 text-sm">
                <AlertCircleIcon className="size-[18px] shrink-0" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </div>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              variant="ghost"
              className={primaryButtonClassName}
              disabled={methods.formState.isSubmitting}
              loading={methods.formState.isSubmitting}
            >
              Create account
            </Button>
            <p
              className={cn(
                mutedClassName,
                'text-center text-xs leading-relaxed'
              )}
            >
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
        </form>
      </FormProvider>
    </div>
  );
}
