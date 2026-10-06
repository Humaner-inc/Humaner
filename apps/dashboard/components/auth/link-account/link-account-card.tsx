'use client';

import * as React from 'react';
import Link from 'next/link';
import { assignTrustedNavigation } from '@humaner/shared/urls';

import { confirmOAuthLink } from '@/actions/auth/confirm-oauth-link';
import {
  authLinkClassName,
  authMutedTextClassName,
  authPageTitleClassName,
  authPrimaryButtonClassName
} from '@/components/auth/auth-form-styles';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import {
  confirmOAuthLinkSchema,
  type ConfirmOAuthLinkSchema
} from '@/schemas/auth/confirm-oauth-link-schema';

export type LinkAccountCardProps = {
  proof: string;
  email: string;
  method: 'password' | 'totp' | 'unsupported';
};

export function LinkAccountCard({
  proof,
  email,
  method
}: LinkAccountCardProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string>();
  const methods = useZodForm({
    schema: confirmOAuthLinkSchema,
    mode: 'onSubmit',
    defaultValues: {
      proof,
      password: '',
      totpCode: ''
    }
  });

  const onSubmit = async (values: ConfirmOAuthLinkSchema): Promise<void> => {
    setFormError(undefined);
    setIsLoading(true);
    try {
      const result = await confirmOAuthLink(values);
      if (result?.validationErrors) {
        const root = result.validationErrors._errors?.[0];
        if (root) {
          setFormError(root);
        }
        const password = result.validationErrors.password?._errors?.[0];
        if (password) {
          methods.setError('password', { message: password });
        }
        const totpCode = result.validationErrors.totpCode?._errors?.[0];
        if (totpCode) {
          methods.setError('totpCode', { message: totpCode });
        }
        return;
      }
      if (result?.data?.redirectTo) {
        assignTrustedNavigation(result.data.redirectTo);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="flex flex-col gap-4"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <div>
          <h1 className={authPageTitleClassName}>Confirm it is your account</h1>
          <p className={cn(authMutedTextClassName, 'mt-2')}>
            {email} already has a Humaner account. Prove you hold it before this
            provider is linked.
          </p>
        </div>
        {formError ? (
          <p className="text-sm text-destructive">{formError}</p>
        ) : null}
        {method === 'password' ? (
          <FormField
            control={methods.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {method === 'totp' ? (
          <FormField
            control={methods.control}
            name="totpCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Authenticator code"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {method === 'unsupported' ? (
          <p className={authMutedTextClassName}>
            Sign in with the provider already on this account, then connect the
            new one from security settings.
          </p>
        ) : (
          <Button
            type="submit"
            className={authPrimaryButtonClassName}
            disabled={isLoading}
            loading={isLoading}
          >
            Link account
          </Button>
        )}
        <Link
          href={Routes.Login}
          className={authLinkClassName}
        >
          Back to sign in
        </Link>
      </form>
    </FormProvider>
  );
}
