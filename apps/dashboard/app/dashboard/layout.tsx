import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPlanForTier } from '@humaner/shared/plans';
import { getPrivacyUrl } from '@humaner/shared/urls';
import { WorkspaceRole } from '@prisma/client';

import { HumanerChatProvider } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { DashboardTopNav } from '@/components/dashboard/dashboard-top-nav';
import { DataImprovementConsentGate } from '@/components/dashboard/data-improvement-consent-gate';
import { DashboardDockProvider } from '@/components/dashboard/dock/dashboard-dock-context';
import { DashboardDockPanel } from '@/components/dashboard/dock/dashboard-dock-panel';
import { DockNotificationsProvider } from '@/components/dashboard/dock/dock-notifications-context';
import { ComposeMailProvider } from '@/components/dashboard/inbox/compose-mail-context';
import { InboxConnectPromptGate } from '@/components/dashboard/inbox/inbox-connect-prompt-gate';
import { PageAccessGate } from '@/components/dashboard/page-access-gate';
import { SidebarRenderer } from '@/components/dashboard/sidebar-renderer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { getAgents } from '@/data/agents/get-agents';
import { getSidebarMessageUsage } from '@/data/billing/get-sidebar-message-usage';
import { getHandoffOpenCounts } from '@/data/handoff/get-handoff-open-count';
import {
  getMailInboxes,
  getMailUnreadCount
} from '@/data/inbox/get-mail-threads';
import { getDashboardNotifications } from '@/data/notifications/get-dashboard-notifications';
import { getWorkspaceSwitcherData } from '@/data/workspaces/get-workspace-switcher-data';
import { OrgModeProvider } from '@/hooks/use-org-mode';
import { resolveAgentAvatarSrc } from '@/lib/agent-avatar';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { getHumanerAgentPublicId } from '@/lib/humaner-agent';
import { buildDashboardVisitorId } from '@/lib/humaner-support-agent';
import { getIndustry } from '@/lib/industries';
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
      inboxConnectPromptPending: true,
      workspaceRole: true,
      role: true,
      organization: {
        select: {
          completedOnboarding: true,
          dataImprovementConsent: true,
          targetAudience: true,
          industry: true,
          tier: true,
          accentColor: true,
          name: true,
          _count: {
            select: { mailboxConnections: true }
          }
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

  const [
    profile,
    agents,
    workspaces,
    messageUsage,
    notificationsResult,
    inboxUnreadCount,
    handoffOpenCounts,
    mailInboxes
  ] = await Promise.all([
    getProfile(),
    getAgents(),
    getWorkspaceSwitcherData(),
    getSidebarMessageUsage(),
    getDashboardNotifications(),
    getMailUnreadCount(),
    getHandoffOpenCounts(),
    isOssDeployment() ? Promise.resolve([]) : getMailInboxes()
  ]);
  const {
    items: notifications,
    teamMembers: notificationTeamMembers,
    currentUserId: notificationCurrentUserId
  } = notificationsResult;

  const showDataImprovementPrompt =
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.organization!.dataImprovementConsent === null;
  const showInboxConnectPrompt =
    !showDataImprovementPrompt &&
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.inboxConnectPromptPending &&
    getPlanForTier(userFromDb!.organization!.tier).mailboxAliases > 0 &&
    userFromDb!.organization!._count.mailboxConnections === 0;

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

  // Platform Ask Humaner agent may live outside the current org — look up by
  // publicId so the header/message avatars use its real profile image.
  const humanerAgentRecord = humanerAgentPublicId
    ? await prisma.agent.findUnique({
        where: { publicId: humanerAgentPublicId },
        select: { image: true, character: true }
      })
    : null;
  const humanerAgentAvatarUrl = resolveAgentAvatarSrc(
    humanerAgentRecord?.image,
    humanerAgentRecord?.character ?? 'CORPORATE'
  );

  const dashboardShell = (
    <>
      <SidebarRenderer
        profile={profile}
        workspaces={workspaces}
        messageUsage={messageUsage}
        orgTier={userFromDb!.organization!.tier ?? 'free'}
        inboxUnreadCount={inboxUnreadCount}
        handoffOpenCount={handoffOpenCounts.humanOpen}
        agentDeskOpenCount={handoffOpenCounts.agentOpen}
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
          workspaces={workspaces}
          planName={getPlanForTier(userFromDb!.organization!.tier).name}
          industryLabel={
            userFromDb!.organization!.industry
              ? getIndustry(userFromDb!.organization!.industry).label
              : null
          }
          audienceLabel={userFromDb!.organization!.targetAudience ?? null}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
            <PageAccessGate profile={profile}>{children}</PageAccessGate>
          </div>
          <DashboardDockPanel />
        </div>
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
        <InboxConnectPromptGate showPrompt={showInboxConnectPrompt} />
        <SidebarProvider>
          <ComposeMailProvider inboxes={mailInboxes}>
            <DashboardDockProvider>
              <DockNotificationsProvider
                notifications={notifications}
                teamMembers={notificationTeamMembers}
                currentUserId={notificationCurrentUserId}
              >
                {humanerAgentPublicId ? (
                  <HumanerChatProvider
                    agentPublicId={humanerAgentPublicId}
                    agentAvatarUrl={humanerAgentAvatarUrl}
                    widgetColor={accentColor}
                    dashboardVisitorId={dashboardVisitorId}
                    visitorMetadata={visitorMetadata}
                  >
                    {dashboardShell}
                  </HumanerChatProvider>
                ) : (
                  dashboardShell
                )}
              </DockNotificationsProvider>
            </DashboardDockProvider>
          </ComposeMailProvider>
        </SidebarProvider>
      </div>
    </OrgModeProvider>
  );
}
