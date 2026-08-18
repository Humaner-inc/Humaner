import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { LoginCard } from '@/components/auth/login/login-card';
import { PersistAuthCallbackUrl } from '@/components/auth/persist-auth-callback-url';
import { Routes } from '@/constants/routes';
import { getSafeAuthCallbackUrl } from '@/lib/auth/callback-url';
import { resolveAuthErrorMessage } from '@/lib/auth/errors';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  error: parseAsString.withDefault(''),
  callbackUrl: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Log in')
};

function LoginFallback(): React.JSX.Element {
  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <LoginCard />
    </AuthOnboardingCardShell>
  );
}

async function LoginPageContent({
  searchParams
}: Pick<NextPageProps, 'searchParams'>): Promise<React.JSX.Element> {
  const { error, callbackUrl } = await searchParamsCache.parse(searchParams);
  const oauthErrorMessage = error ? resolveAuthErrorMessage(error) : undefined;

  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      {/* Cookie writes must run in a Server Action, not during RSC render.
          Always persist a destination so a stale Auth.js callback cookie
          (e.g. /settings/account/profile) cannot override the org home. */}
      <PersistAuthCallbackUrl
        callbackUrl={getSafeAuthCallbackUrl(callbackUrl, Routes.Home)}
      />
      <LoginCard initialErrorMessage={oauthErrorMessage} />
    </AuthOnboardingCardShell>
  );
}

export default function LoginPage(props: NextPageProps): React.JSX.Element {
  return (
    <React.Suspense fallback={<LoginFallback />}>
      <LoginPageContent searchParams={props.searchParams} />
    </React.Suspense>
  );
}
