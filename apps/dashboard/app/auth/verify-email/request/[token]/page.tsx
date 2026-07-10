import * as React from 'react';
import { type Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { Routes } from '@/constants/routes';
import { completeEmailVerification } from '@/lib/auth/complete-email-verification';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';
import { NotFoundError } from '@/lib/validation/exceptions';
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

  const verificationToken = await prisma.verificationToken.findFirst({
    where: { token },
    select: { identifier: true }
  });
  if (!verificationToken) {
    return notFound();
  }

  const user = await prisma.user.findFirst({
    where: { email: verificationToken.identifier },
    select: { id: true }
  });
  if (!user) {
    return notFound();
  }

  try {
    const { redirectTo } = await completeEmailVerification({
      type: 'token',
      token
    });
    return redirect(redirectTo);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound();
    }
    return redirect(Routes.AuthError);
  }
}
