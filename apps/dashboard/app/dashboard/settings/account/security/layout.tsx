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

export default async function SecurityLayout({
  changePassword,
  connectedAccounts,
  multiFactorAuthentication,
  manageSessions,
  auditLogs
}: SecurityLayoutProps): Promise<React.JSX.Element> {
  const authSession = await dedupedAuth();
  let showMfaRecommendation = false;
  let isOwner = false;

  if (checkSession(authSession)) {
    const user = await prisma.user.findFirst({
      where: { id: authSession.user.id },
      select: { workspaceRole: true, role: true }
    });
    if (user) {
      isOwner = user.workspaceRole === WorkspaceRole.OWNER;
      showMfaRecommendation = await shouldRecommendMfa(
        authSession.user.id,
        user.workspaceRole,
        user.role
      );
    }
  }

  return (
    <AnnotatedLayout className="py-0">
      {showMfaRecommendation ? <MfaRecommendedBanner /> : null}
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
      {isOwner ? (
        <>
          <Separator />
          {auditLogs}
        </>
      ) : null}
    </AnnotatedLayout>
  );
}
