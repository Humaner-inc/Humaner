import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { LoginCard } from '@/components/auth/login/login-card';
import { PersistAuthCallbackUrl } from '@/components/auth/persist-auth-callback-url';
import { resolveAuthErrorMessage } from '@/lib/auth/errors';
import { isOssDeployment } from '@/lib/deployment-mode';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  error: parseAsString.withDefault(''),
  callbackUrl: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Log in')
};

export default async function LoginPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const { error, callbackUrl } = await searchParamsCache.parse(searchParams);
  const oauthErrorMessage = error ? resolveAuthErrorMessage(error) : undefined;

  return (
    <AuthOnboardingCardShell
      showLogo={isOssDeployment()}
      maxWidth="sm"
      className={isOssDeployment() ? 'text-foreground' : undefined}
    >
      {/* Cookie writes must run in a Server Action, not during RSC render. */}
      {callbackUrl ? (
        <PersistAuthCallbackUrl callbackUrl={callbackUrl} />
      ) : null}
      <LoginCard initialErrorMessage={oauthErrorMessage} />
    </AuthOnboardingCardShell>
  );
}
