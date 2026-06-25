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
  title: createTitle('Confirm via authenticator app')
};

export default async function TotpPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const { token, expiry } = await searchParamsCache.parse(searchParams);

  if (!token) {
    return <AuthContainer>Missing token param.</AuthContainer>;
  }
  if (!expiry) {
    return <AuthContainer>Missing expiry param.</AuthContainer>;
  }

  return (
    <AuthContainer maxWidth="sm">
      <TotpCodeCard
        token={token}
        expiry={expiry}
      />
    </AuthContainer>
  );
}
