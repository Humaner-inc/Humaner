import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { WorkspaceRole } from '@prisma/client';
import { getPrivacyUrl } from '@humaner/shared/urls';

import { SidebarRenderer } from '@/components/dashboard/sidebar-renderer';
import { DashboardTopNav } from '@/components/dashboard/dashboard-top-nav';
import { DataImprovementConsentGate } from '@/components/dashboard/data-improvement-consent-gate';
import { PageAccessGate } from '@/components/dashboard/page-access-gate';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { getDashboardNotifications } from '@/data/notifications/get-dashboard-notifications';
import { getWorkspaceSwitcherData } from '@/data/workspaces/get-workspace-switcher-data';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Dashboard')
};

export default async function DashboardLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const userFromDb = await prisma.user.findFirst({
    where: { id: session.user.id },
    select: {
      completedOnboarding: true,
      workspaceRole: true,
      organization: {
        select: {
          completedOnboarding: true,
          dataImprovementConsent: true
        }
      }
    }
  });
  if (
    !userFromDb!.completedOnboarding ||
    !userFromDb!.organization!.completedOnboarding
  ) {
    return redirect(Routes.Onboarding);
  }

  const profile = await getProfile();
  const workspaces = await getWorkspaceSwitcherData();
  const { items: notifications } = await getDashboardNotifications();

  const showDataImprovementPrompt =
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.organization!.dataImprovementConsent === null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <DataImprovementConsentGate
        privacyPolicyUrl={getPrivacyUrl()}
        showPrompt={showDataImprovementPrompt}
      />
      <SidebarProvider>
        <SidebarRenderer
          profile={profile}
          workspaces={workspaces}
        />
        {/* Set max-width so full-width tables can overflow horizontally correctly */}
        <SidebarInset
          id="skip"
          className="min-h-0 min-w-0 flex-1"
        >
          <DashboardTopNav
            profile={profile}
            notifications={notifications}
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <PageAccessGate profile={profile}>{children}</PageAccessGate>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
