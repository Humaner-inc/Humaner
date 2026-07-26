import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { LoginCard } from '@/components/auth/login/login-card';
import { resolveAuthErrorMessage } from '@/lib/auth/errors';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  error: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Log in')
};

export default async function LoginPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const { error } = await searchParamsCache.parse(searchParams);
  const oauthErrorMessage = error ? resolveAuthErrorMessage(error) : undefined;

  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <LoginCard initialErrorMessage={oauthErrorMessage} />
    </AuthOnboardingCardShell>
  );
}
