import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { LinkAccountCard } from '@/components/auth/link-account/link-account-card';
import { readOAuthLinkProof } from '@/lib/auth/oauth-link-proof';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  proof: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Link account')
};

export default async function LinkAccountPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const { proof } = await searchParamsCache.parse(searchParams);
  const payload = proof ? await readOAuthLinkProof(proof) : null;
  const user = payload
    ? await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          email: true,
          password: true,
          authenticatorApp: { select: { id: true } }
        }
      })
    : null;

  if (!payload || !user?.email) {
    return (
      <AuthOnboardingCardShell
        showLogo={false}
        maxWidth="sm"
      >
        This link request expired. Sign in with the provider again.
      </AuthOnboardingCardShell>
    );
  }

  const method = user.authenticatorApp
    ? 'totp'
    : user.password
      ? 'password'
      : 'unsupported';

  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <LinkAccountCard
        proof={proof}
        email={user.email}
        method={method}
      />
    </AuthOnboardingCardShell>
  );
}
