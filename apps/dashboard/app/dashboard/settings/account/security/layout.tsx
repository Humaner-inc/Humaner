import * as React from 'react';
import type { Metadata } from 'next';
import { WorkspaceRole } from '@prisma/client';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getUserAccessContext } from '@/lib/auth/require-workspace-access';
import { checkSession, session } from '@/lib/auth/session';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(Routes.Security);

export type SecurityLayoutProps = {
  changePassword: React.ReactNode;
  connectedAccounts: React.ReactNode;
  multiFactorAuthentication: React.ReactNode;
  manageSessions: React.ReactNode;
  auditLogs: React.ReactNode;
};

async function getSecurityLayoutUser(): Promise<{
  isOwner: boolean;
}> {
  const authSession = await dedupedAuth();
  if (!checkSession(authSession)) {
    return { isOwner: false };
  }

  const context = await getUserAccessContext(authSession.user.id);
  if (!context) {
    return { isOwner: false };
  }

  return {
    isOwner: context.workspaceRole === WorkspaceRole.OWNER
  };
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
      {changePassword}
      <Separator />
      {connectedAccounts}
      <Separator />
      <div
        id="account-mfa"
        className="scroll-mt-4"
      >
        {multiFactorAuthentication}
      </div>
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
