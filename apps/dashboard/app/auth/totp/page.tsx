import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthContainer } from '@/components/auth/auth-container';
import { TotpCodeCard } from '@/components/auth/totp/totp-code-card';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  token: parseAsString.withDefault(''),
  expiry: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Authenticator code')
};

export default async function TotpPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const { token, expiry } = await searchParamsCache.parse(searchParams);

  if (!token) {
    return <AuthContainer showLogo={false}>Missing token param.</AuthContainer>;
  }
  if (!expiry) {
    return (
      <AuthContainer showLogo={false}>Missing expiry param.</AuthContainer>
    );
  }

  return (
    <AuthContainer
      showLogo={false}
      maxWidth="sm"
    >
      <TotpCodeCard
        token={token}
        expiry={expiry}
      />
    </AuthContainer>
  );
}
