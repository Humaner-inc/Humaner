import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPrivacyUrl } from '@humaner/shared/urls';
import { WorkspaceRole } from '@prisma/client';

import { AskHumanerSlideUp } from '@/components/dashboard/ask-humaner/ask-humaner-slide-up';
import { HumanerChatProvider } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { DashboardTopNav } from '@/components/dashboard/dashboard-top-nav';
import { DataImprovementConsentGate } from '@/components/dashboard/data-improvement-consent-gate';
import { PageAccessGate } from '@/components/dashboard/page-access-gate';
import { SidebarRenderer } from '@/components/dashboard/sidebar-renderer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { getAgents } from '@/data/agents/get-agents';
import { getSidebarMessageUsage } from '@/data/billing/get-sidebar-message-usage';
import { getDashboardNotifications } from '@/data/notifications/get-dashboard-notifications';
import { getWorkspaceSwitcherData } from '@/data/workspaces/get-workspace-switcher-data';
import { OrgModeProvider } from '@/hooks/use-org-mode';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getHumanerAgentPublicId } from '@/lib/humaner-agent';
import { buildDashboardVisitorId } from '@/lib/humaner-support-agent';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';
import { getPathname } from '@/lib/network/get-pathname';

export function generateMetadata(): Metadata {
  const pathname = getPathname() ?? Routes.Home;
  return createDashboardPageMetadata(pathname);
}

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
          dataImprovementConsent: true,
          targetAudience: true,
          tier: true,
          accentColor: true,
          name: true
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

  const [profile, agents, workspaces, messageUsage, notificationsResult] =
    await Promise.all([
      getProfile(),
      getAgents(),
      getWorkspaceSwitcherData(),
      getSidebarMessageUsage(),
      getDashboardNotifications()
    ]);
  const { items: notifications } = notificationsResult;

  const showDataImprovementPrompt =
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.organization!.dataImprovementConsent === null;

  const accentColor = userFromDb!.organization!.accentColor ?? undefined;
  const humanerAgentPublicId = getHumanerAgentPublicId();
  const dashboardVisitorId = buildDashboardVisitorId(session.user.id);
  const displayName = profile.name.trim();
  const nameParts = displayName.split(/\s+/).filter(Boolean);
  const visitorMetadata = {
    ...(nameParts[0] ? { firstName: nameParts[0] } : {}),
    ...(nameParts.length > 1 ? { lastName: nameParts.slice(1).join(' ') } : {}),
    ...(profile.email ? { email: profile.email } : {}),
    ...(userFromDb!.organization!.name
      ? { company: userFromDb!.organization!.name }
      : {})
  };

  const dashboardShell = (
    <>
      <SidebarRenderer
        profile={profile}
        workspaces={workspaces}
        messageUsage={messageUsage}
        orgTier={userFromDb!.organization!.tier ?? 'free'}
        agents={agents.map((a) => ({
          id: a.id,
          name: a.name,
          image: a.image,
          character: a.character,
          isPaused: a.isPaused
        }))}
      />
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
        <AskHumanerSlideUp />
      </SidebarInset>
    </>
  );

  return (
    <OrgModeProvider targetAudience={userFromDb!.organization!.targetAudience}>
      <div
        className="flex h-screen overflow-hidden bg-background text-foreground"
        style={
          accentColor
            ? ({ '--accent-color': accentColor } as React.CSSProperties)
            : undefined
        }
      >
        <DataImprovementConsentGate
          privacyPolicyUrl={getPrivacyUrl()}
          showPrompt={showDataImprovementPrompt}
        />
        <SidebarProvider>
          {humanerAgentPublicId ? (
            <HumanerChatProvider
              agentPublicId={humanerAgentPublicId}
              widgetColor={accentColor}
              dashboardVisitorId={dashboardVisitorId}
              visitorMetadata={visitorMetadata}
            >
              {dashboardShell}
            </HumanerChatProvider>
          ) : (
            dashboardShell
          )}
        </SidebarProvider>
      </div>
    </OrgModeProvider>
  );
}
