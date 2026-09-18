'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircleIcon, MailIcon } from '@humaner/shared/icons';
import { type SubmitHandler } from 'react-hook-form';

import { sendResetPasswordInstructions } from '@/actions/auth/send-reset-password-instructions';
import {
  authAlertDestructiveClassName,
  authDestructiveMessageClassName,
  authHighlightButtonClassName,
  authInputAdornmentClassName,
  authInputClassName,
  authLabelClassName,
  authMutedTextClassName,
  authOutlineButtonClassName,
  authPageTitleClassName
} from '@/components/auth/auth-form-styles';
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
import { InputWithAdornments } from '@/components/ui/input-with-adornments';
import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  sendResetPasswordInstructionsSchema,
  type SendResetPasswordInstructionsSchema
} from '@/schemas/auth/send-reset-password-instructions-schema';

export function ForgotPasswordCard(): React.JSX.Element {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const methods = useZodForm({
    schema: sendResetPasswordInstructionsSchema,
    mode: 'onSubmit',
    defaultValues: {
      email: ''
    }
  });
  const canSubmit = !methods.formState.isSubmitting;
  const onSubmit: SubmitHandler<SendResetPasswordInstructionsSchema> = async (
    values
  ) => {
    if (!canSubmit) {
      return;
    }
    const result = await sendResetPasswordInstructions(values);
    if (!result?.serverError && !result?.validationErrors) {
      setErrorMessage(undefined);
      router.replace(`${Routes.ForgotPasswordSuccess}?email=${values.email}`);
    } else {
      setErrorMessage("Couldn't request password change");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className={authPageTitleClassName}>{AppInfo.APP_NAME}</h1>
        <p className={authMutedTextClassName}>
          Forgot your password? We&apos;ll send a reset link to your email.
        </p>
      </div>

      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
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
                        className={cn(
                          'size-4 shrink-0',
                          authInputAdornmentClassName
                        )}
                      />
                    }
                    disabled={methods.formState.isSubmitting}
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
                <AlertDescription>{errorMessage}</AlertDescription>
              </div>
            </Alert>
          ) : null}
          <Button
            type="submit"
            variant="ghost"
            className={authHighlightButtonClassName}
            disabled={!canSubmit}
            loading={methods.formState.isSubmitting}
          >
            Send instructions
          </Button>
        </form>
      </FormProvider>

      <div className="space-y-3 pt-2">
        <p className={cn(authMutedTextClassName, 'text-center')}>
          Remembered your password?
        </p>
        <Button
          type="button"
          variant="ghost"
          className={authOutlineButtonClassName}
          asChild
        >
          <Link href={Routes.Login}>Log in</Link>
        </Button>
      </div>
    </div>
  );
}
