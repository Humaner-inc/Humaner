import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { NoWorkspacePage } from '@/components/workspace/no-workspace-page';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkAuthenticatedSession, checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createPageMetadata } from '@/lib/metadata/create-page-metadata';

export const metadata: Metadata = createPageMetadata(
  Routes.NoWorkspace,
  'Create workspace'
);

export default async function WorkspacePage(): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!checkAuthenticatedSession(session)) {
    return redirect(getLoginRedirect());
  }
  if (checkSession(session)) {
    return redirect(Routes.Home);
  }

  const pending = await prisma.workspaceJoinRequest.findFirst({
    where: {
      userId: session.user.id,
      status: 'PENDING'
    },
    select: {
      organization: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <NoWorkspacePage
      email={session.user.email}
      name={session.user.name}
      pendingJoinRequest={
        pending ? { organizationName: pending.organization.name } : null
      }
    />
  );
}
