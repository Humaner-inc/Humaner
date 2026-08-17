import * as React from 'react';
import { WorkspaceRole } from '@prisma/client';

import { MfaRecommendedBanner } from '@/components/dashboard/settings/account/security/mfa-required-banner';
import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { dedupedAuth } from '@/lib/auth';
import { shouldRecommendMfa } from '@/lib/auth/recommend-mfa';
import { checkSession, session } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type SecurityLayoutProps = {
  changePassword: React.ReactNode;
  connectedAccounts: React.ReactNode;
  multiFactorAuthentication: React.ReactNode;
  manageSessions: React.ReactNode;
  auditLogs: React.ReactNode;
};

async function getSecurityLayoutUser(): Promise<{
  showMfaRecommendation: boolean;
  isOwner: boolean;
}> {
  const authSession = await dedupedAuth();
  if (!checkSession(authSession)) {
    return { showMfaRecommendation: false, isOwner: false };
  }

  const user = await prisma.user.findFirst({
    where: { id: authSession.user.id },
    select: { workspaceRole: true, role: true }
  });
  if (!user) {
    return { showMfaRecommendation: false, isOwner: false };
  }

  return {
    isOwner: user.workspaceRole === WorkspaceRole.OWNER,
    showMfaRecommendation: await shouldRecommendMfa(
      authSession.user.id,
      user.workspaceRole,
      user.role
    )
  };
}

async function MfaRecommendation(): Promise<React.JSX.Element | null> {
  const { showMfaRecommendation } = await getSecurityLayoutUser();
  return showMfaRecommendation ? <MfaRecommendedBanner /> : null;
}

async function OwnerAuditLogs({
  auditLogs
}: {
  auditLogs: React.ReactNode;
}): Promise<React.JSX.Element | null> {
  const { isOwner } = await getSecurityLayoutUser();
  if (!isOwner) {
    return null;
  }
  return (
    <>
      <Separator />
      {auditLogs}
    </>
  );
}

export default function SecurityLayout({
  changePassword,
  connectedAccounts,
  multiFactorAuthentication,
  manageSessions,
  auditLogs
}: SecurityLayoutProps): React.JSX.Element {
  return (
    <AnnotatedLayout className="py-0">
      <React.Suspense fallback={null}>
        <MfaRecommendation />
      </React.Suspense>
      {changePassword}
      <Separator />
      {connectedAccounts}
      <Separator />
      {multiFactorAuthentication}
      {session.strategy === 'database' && (
        <>
          <Separator />
          {manageSessions}
        </>
      )}
      <React.Suspense fallback={null}>
        <OwnerAuditLogs auditLogs={auditLogs} />
      </React.Suspense>
    </AnnotatedLayout>
  );
}
