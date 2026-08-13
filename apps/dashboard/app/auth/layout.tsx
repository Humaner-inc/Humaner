import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthLayoutFrame } from '@/components/auth/auth-layout-frame';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getPostVerificationRedirect } from '@/lib/auth/establish-user-session';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { createPageMetadata } from '@/lib/metadata/create-page-metadata';
import { getPathname } from '@/lib/network/get-pathname';

const AUTH_TITLES: Record<string, string> = {
  [Routes.Login]: 'Log in',
  [Routes.SignUp]: 'Sign up',
  [Routes.ForgotPassword]: 'Forgot password',
  [Routes.ForgotPasswordSuccess]: 'Forgot password',
  [Routes.ResetPassword]: 'Reset password',
  [Routes.VerifyEmail]: 'Verify email',
  [Routes.Totp]: 'Two-factor authentication',
  [Routes.RecoveryCode]: 'Recovery code',
  [Routes.Logout]: 'Log out'
};

export function generateMetadata(): Metadata {
  const pathname = getPathname() ?? Routes.Login;
  const title =
    AUTH_TITLES[pathname] ??
    (pathname.startsWith(Routes.Auth) ? 'Auth' : 'Auth');
  return createPageMetadata(pathname, title);
}

function isChangeEmailRoute(): boolean {
  const pathname = getPathname();
  return !!pathname && pathname.startsWith(Routes.ChangeEmail);
}

function isLogoutRoute(): boolean {
  const pathname = getPathname();
  return !!pathname && pathname.startsWith(Routes.Logout);
}

function isVerifyEmailRoute(): boolean {
  const pathname = getPathname();
  return !!pathname && pathname.startsWith(Routes.VerifyEmail);
}

/** MFA challenge pages — client owns the post-success navigation. */
function isMfaChallengeRoute(): boolean {
  const pathname = getPathname();
  return pathname === Routes.Totp || pathname === Routes.RecoveryCode;
}

function isLoginOrSignUpRoute(): boolean {
  const pathname = getPathname();
  return pathname === Routes.Login || pathname === Routes.SignUp;
}

async function getAuthenticatedRedirect(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      completedOnboarding: true,
      organizationId: true,
      organization: { select: { completedOnboarding: true } },
      organizationMemberships: { select: { id: true }, take: 1 }
    }
  });

  return getPostVerificationRedirect({
    completedOnboarding: user?.completedOnboarding ?? false,
    organizationCompletedOnboarding:
      user?.organization?.completedOnboarding ?? false,
    hasOrganization:
      Boolean(user?.organizationId) ||
      (user?.organizationMemberships.length ?? 0) > 0
  });
}

export default async function AuthLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (
    !isChangeEmailRoute() &&
    !isLogoutRoute() &&
    !isVerifyEmailRoute() &&
    !isMfaChallengeRoute() &&
    session?.user?.id
  ) {
    return redirect(await getAuthenticatedRedirect(session.user.id));
  }

  const oss = isOssDeployment();
  const showBackToMarketing = !oss && isLoginOrSignUpRoute();

  return (
    <AuthLayoutFrame showBackToMarketing={showBackToMarketing}>
      {children}
    </AuthLayoutFrame>
  );
}
