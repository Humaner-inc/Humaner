'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LockIcon } from '@humaner/shared/icons';

import { submitAuthAccessCode } from '@/actions/auth/submit-auth-access-code';
import {
  authDestructiveMessageClassName,
  authHighlightButtonClassName,
  authInputAdornmentClassName,
  authInputClassName,
  authMutedTextClassName,
  authPageTitleClassName
} from '@/components/auth/auth-form-styles';
import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { InputWithAdornments } from '@/components/ui/input-with-adornments';
import { useZodForm } from '@/hooks/use-zod-form';
import { AUTH_ACCESS_CODE_LENGTH } from '@/lib/auth/access-code-constants';
import { brandAngleSurfaceClassName } from '@/lib/dashboard/brand-angle-styles';
import { cn } from '@/lib/utils';
import {
  submitAuthAccessCodeSchema,
  type SubmitAuthAccessCodeSchema
} from '@/schemas/auth/submit-auth-access-code-schema';

export function AuthAccessWall(): React.JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const methods = useZodForm({
    schema: submitAuthAccessCodeSchema,
    mode: 'onSubmit',
    defaultValues: {
      code: ''
    }
  });

  const onSubmit = async (
    values: SubmitAuthAccessCodeSchema
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await submitAuthAccessCode(values);
      if (result?.serverError) {
        methods.setError('code', {
          message: result.serverError
        });
        return;
      }
      const fieldError = result?.validationErrors?.code?._errors?.[0];
      if (fieldError) {
        methods.setError('code', { message: fieldError });
        return;
      }
      if (result?.data?.unlocked) {
        router.refresh();
        return;
      }
      methods.setError('code', {
        message: 'That code is not valid.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <span
              className={cn(
                'relative flex size-14 items-center justify-center overflow-hidden border border-white/[0.12] bg-[#2252bc] text-[#F2F2F2] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.14),0_24px_48px_-28px_rgb(34_82_188_/_0.55)] sm:size-16',
                brandAngleSurfaceClassName('rounded-xl')
              )}
              aria-hidden
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_90%_90%_at_50%_0%,rgb(255_255_255_/_0.18),transparent)]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- public companion mark */}
              <img
                src="/companion.svg"
                alt=""
                width={36}
                height={36}
                className="relative z-10 size-8 brightness-0 invert sm:size-9"
              />
            </span>
          </div>
          <h1 className={authPageTitleClassName}>Invite only</h1>
          <p className={authMutedTextClassName}>
            Log in and sign up are on invitation only. Enter your access code to
            continue. (hint: it's 11 caracters)
          </p>
        </div>

        <FormProvider {...methods}>
          <form
            className="flex flex-col gap-4"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputWithAdornments
                      {...field}
                      autoComplete="off"
                      autoFocus
                      spellCheck={false}
                      maxLength={AUTH_ACCESS_CODE_LENGTH}
                      placeholder="Access code"
                      aria-label="Access code"
                      className={cn(
                        authInputClassName,
                        'font-mono tracking-[0.18em]'
                      )}
                      startAdornment={
                        <LockIcon
                          className={cn(authInputAdornmentClassName, 'size-4')}
                        />
                      }
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className={authDestructiveMessageClassName} />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className={authHighlightButtonClassName}
            >
              {isLoading ? 'Checking…' : 'Continue'}
            </Button>
          </form>
        </FormProvider>
      </div>
    </AuthOnboardingCardShell>
  );
}
