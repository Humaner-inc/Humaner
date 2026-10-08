import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { InvitationStatus } from '@prisma/client';
import { validate as uuidValidate } from 'uuid';

import { AuthAccessWall } from '@/components/auth/auth-access-wall';
import { AuthLayoutFrame } from '@/components/auth/auth-layout-frame';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import {
  hasAuthAccessUnlock,
  isAuthAccessGateEnabled
} from '@/lib/auth/access-code';
import { getPostVerificationRedirect } from '@/lib/auth/establish-user-session';
import { readCollabInboxSvg } from '@/lib/collab-inbox-svg';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { createPageMetadata } from '@/lib/metadata/create-page-metadata';
import { getPathname, getSearchParam } from '@/lib/network/get-pathname';

export const metadata: Metadata = {
  ...createPageMetadata(Routes.Login, 'Log in'),
  robots: {
    index: true,
    follow: true
  }
};

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

async function hasPendingInvitationSignup(): Promise<boolean> {
  if (getPathname() !== Routes.SignUp) {
    return false;
  }
  const token = getSearchParam('invitation');
  if (!token || !uuidValidate(token)) {
    return false;
  }
  const invitation = await prisma.invitation.findFirst({
    where: { token, status: InvitationStatus.PENDING },
    select: { id: true }
  });
  return Boolean(invitation);
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

async function readAuthSession() {
  try {
    return await dedupedAuth();
  } catch (error) {
    console.error('[auth] session lookup failed', error);
    return null;
  }
}

async function AuthLoggedInRedirect(): Promise<null> {
  const session = await readAuthSession();
  if (
    !isChangeEmailRoute() &&
    !isLogoutRoute() &&
    !isVerifyEmailRoute() &&
    !isMfaChallengeRoute() &&
    session?.user?.id
  ) {
    redirect(await getAuthenticatedRedirect(session.user.id));
  }
  return null;
}

async function AuthAccessSwitch({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  const showWall =
    isLoginOrSignUpRoute() &&
    isAuthAccessGateEnabled() &&
    !(await hasAuthAccessUnlock()) &&
    !(await hasPendingInvitationSignup());

  if (!showWall) {
    return <>{children}</>;
  }

  return (
    <>
      <AuthAccessWall />
      <div hidden>{children}</div>
    </>
  );
}

async function AuthLayoutBody({
  children,
  mailboxSvg
}: React.PropsWithChildren<{
  mailboxSvg: string;
}>): Promise<React.JSX.Element> {
  // Postpone before Auth.js session work hits crypto during prerender.
  // `cookies()` alone is not enough: it can resolve during the prerender pass.
  await connection();
  await AuthLoggedInRedirect();
  const showBackToMarketing = !isOssDeployment() && isLoginOrSignUpRoute();

  return (
    <AuthLayoutFrame
      showBackToMarketing={showBackToMarketing}
      mailboxSvg={mailboxSvg}
    >
      <React.Suspense fallback={null}>
        <AuthAccessSwitch>{children}</AuthAccessSwitch>
      </React.Suspense>
    </AuthLayoutFrame>
  );
}

export default function AuthLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const mailboxSvg = readCollabInboxSvg();

  return (
    <React.Suspense
      fallback={
        <AuthLayoutFrame
          showBackToMarketing
          mailboxSvg={mailboxSvg}
        />
      }
    >
      <AuthLayoutBody mailboxSvg={mailboxSvg}>{children}</AuthLayoutBody>
    </React.Suspense>
  );
}
