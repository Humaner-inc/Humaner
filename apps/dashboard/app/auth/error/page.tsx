import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthContainer } from '@/components/auth/auth-container';
import { AuthErrorCard } from '@/components/auth/error/auth-error-card';
import { AuthErrorCode, authErrorMessages } from '@/lib/auth/errors';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  error: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Auth Error')
};

export default async function AuthErrorPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const { error } = await searchParamsCache.parse(searchParams);

  const errorMessage =
    error in authErrorMessages
      ? authErrorMessages[error as AuthErrorCode]
      : authErrorMessages[AuthErrorCode.UnknownError];
  return (
    <AuthContainer maxWidth="sm">
      <AuthErrorCard errorMessage={errorMessage} />
    </AuthContainer>
  );
}
