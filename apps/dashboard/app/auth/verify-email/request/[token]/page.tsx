import * as React from 'react';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { VerifyEmailTokenClient } from '@/components/auth/verify-email/verify-email-token-client';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const paramsCache = createSearchParamsCache({
  token: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Email Verification')
};

export default async function EmailVerificationPage({
  params
}: NextPageProps): Promise<React.JSX.Element> {
  const { token } = await paramsCache.parse(params);
  if (!token) {
    return notFound();
  }

  return (
    <AuthOnboardingCardShell>
      <VerifyEmailTokenClient token={token} />
    </AuthOnboardingCardShell>
  );
}
