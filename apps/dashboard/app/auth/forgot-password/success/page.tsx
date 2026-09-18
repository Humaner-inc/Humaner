import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { ForgotPasswordSuccessCard } from '@/components/auth/forgot-password/forgot-password-success-card';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  email: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Reset link sent')
};

export default async function ForgotPasswordSuccessPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const { email } = await searchParamsCache.parse(searchParams);
  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <ForgotPasswordSuccessCard email={email} />
    </AuthOnboardingCardShell>
  );
}
