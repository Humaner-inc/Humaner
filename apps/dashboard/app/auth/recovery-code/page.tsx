import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { RecoveryCodeCard } from '@/components/auth/recovery-code/recovery-code-card';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  token: parseAsString.withDefault(''),
  expiry: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Recovery code')
};

export default async function RecoveryCodePage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const { token, expiry } = await searchParamsCache.parse(searchParams);

  if (!token) {
    return (
      <AuthOnboardingCardShell
        showLogo={false}
        maxWidth="sm"
      >
        Missing token param.
      </AuthOnboardingCardShell>
    );
  }
  if (!expiry) {
    return (
      <AuthOnboardingCardShell
        showLogo={false}
        maxWidth="sm"
      >
        Missing expiry param.
      </AuthOnboardingCardShell>
    );
  }

  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <RecoveryCodeCard
        token={token}
        expiry={expiry}
      />
    </AuthOnboardingCardShell>
  );
}
