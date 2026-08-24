import * as React from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { brand } from '@/brand.config';
import { getVerticalConfig } from '@/services/training/verticals';
import {
  FRONTIER_PLAN_COMING_SOON,
  getPlanCapabilities,
  getPlanForTier
} from '@humaner/shared/plans';
import { getPrivacyUrl } from '@humaner/shared/urls';
import { pickSuggestedTopics } from '@humaner/shared/widget-suggested-topics';
import { WorkspaceRole } from '@prisma/client';

import { HumanerChatProvider } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { DashboardTopNav } from '@/components/dashboard/dashboard-top-nav';
import { DataImprovementConsentGate } from '@/components/dashboard/data-improvement-consent-gate';
import { DashboardDockProvider } from '@/components/dashboard/dock/dashboard-dock-context';
import { DashboardDockPanel } from '@/components/dashboard/dock/dashboard-dock-panel';
import { DockNotificationsProvider } from '@/components/dashboard/dock/dock-notifications-context';
import { ComposeMailProvider } from '@/components/dashboard/inbox/compose-mail-context';
import { InboxConnectPromptGate } from '@/components/dashboard/inbox/inbox-connect-prompt-gate';
import { OrgRealtimeBridge } from '@/components/dashboard/org-realtime-bridge';
import { PageAccessGate } from '@/components/dashboard/page-access-gate';
import { SidebarRenderer } from '@/components/dashboard/sidebar-renderer';
import { FrontierBetaPromptGate } from '@/components/onboarding/frontier-beta-prompt-gate';
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
import {
  canAccessPageKey,
  requirePathAccessFromHeaders
} from '@/lib/auth/require-workspace-access';
import { checkAuthenticatedSession, checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { getHumanerAgentPublicId } from '@/lib/humaner-agent';
import { buildDashboardVisitorId } from '@/lib/humaner-support-agent';
import { getIndustry } from '@/lib/industries';
import { ASK_HUMANER_ACCENT } from '@/lib/urls/extract-brand-accent-color';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

export async function DashboardSessionShell({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  await connection();
  const session = await dedupedAuth();
  if (!checkAuthenticatedSession(session)) {
    return redirect(getLoginRedirect());
  }

  const userFromDb = await prisma.user.findFirst({
    where: { id: session.user.id },
    select: {
      completedOnboarding: true,
      inboxConnectPromptPending: true,
      frontierBetaEnabled: true,
      workspaceRole: true,
      role: true,
      allowedPages: true,
      organization: {
        select: {
          completedOnboarding: true,
          dataImprovementConsent: true,
          targetAudience: true,
          industry: true,
          tier: true,
          frontierBetaEnabled: true,
          accentColor: true,
          name: true,
          verticalTopics: true,
          _count: {
            select: { mailboxConnections: true }
          }
        }
      }
    }
  });

  if (!checkSession(session)) {
    if (!userFromDb?.completedOnboarding) {
      return redirect(Routes.Onboarding);
    }
    return redirect(Routes.NoWorkspace);
  }

  // Owners must finish workspace setup. Teammates only need their own
  // onboarding — they should not be trapped in the business-owner wizard.
  const isWorkspaceOwner = userFromDb!.workspaceRole === WorkspaceRole.OWNER;
  if (
    !userFromDb!.completedOnboarding ||
    (isWorkspaceOwner && !userFromDb!.organization!.completedOnboarding)
  ) {
    return redirect(Routes.Onboarding);
  }

  await requirePathAccessFromHeaders();

  const oss = isOssDeployment();
  const canDesk = canAccessPageKey(
    {
      role: userFromDb!.role,
      workspaceRole: userFromDb!.workspaceRole,
      allowedPages: userFromDb!.allowedPages
    },
    'desk'
  );
  const canInbox = canAccessPageKey(
    {
      role: userFromDb!.role,
      workspaceRole: userFromDb!.workspaceRole,
      allowedPages: userFromDb!.allowedPages
    },
    'inbox'
  );
  const emptyMessageUsage: SidebarMessageUsageDto = {
    messagesUsed: 0,
    includedMessages: 0,
    tier: userFromDb!.organization!.tier ?? 'free',
    operatorOwnedQuota: false
  };
  const humanerAgentPublicId = getHumanerAgentPublicId();

  const [
    profile,
    agents,
    workspaces,
    messageUsage,
    notificationsResult,
    inboxUnreadCount,
    handoffOpenCounts,
    mailInboxes,
    humanerAgentRecord
  ] = await Promise.all([
    getProfile(),
    getAgents(),
    getWorkspaceSwitcherData(),
    oss ? Promise.resolve(emptyMessageUsage) : getSidebarMessageUsage(),
    getDashboardNotifications(),
    oss || !canInbox ? Promise.resolve(0) : getMailUnreadCount(),
    canDesk
      ? getHandoffOpenCounts()
      : Promise.resolve({ humanOpen: 0, agentOpen: 0 }),
    oss || !canInbox ? Promise.resolve([]) : getMailInboxes(),
    !oss && humanerAgentPublicId
      ? prisma.agent.findUnique({
          where: { publicId: humanerAgentPublicId },
          select: {
            image: true,
            character: true,
            organization: { select: { name: true } }
          }
        })
      : Promise.resolve(null)
  ]);
  const {
    items: notifications,
    teamMembers: notificationTeamMembers,
    currentUserId: notificationCurrentUserId
  } = notificationsResult;

  const showDataImprovementPrompt =
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.organization!.dataImprovementConsent === null;
  const showFrontierBetaPrompt =
    FRONTIER_PLAN_COMING_SOON &&
    !showDataImprovementPrompt &&
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.inboxConnectPromptPending &&
    userFromDb!.organization!.tier === 'classic' &&
    !userFromDb!.frontierBetaEnabled &&
    !userFromDb!.organization!.frontierBetaEnabled;
  const showInboxConnectPrompt =
    !FRONTIER_PLAN_COMING_SOON &&
    !showDataImprovementPrompt &&
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.inboxConnectPromptPending &&
    getPlanForTier(userFromDb!.organization!.tier).mailboxAliases > 0 &&
    userFromDb!.organization!._count.mailboxConnections === 0;

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

  const humanerAgentAvatarUrl = resolveAgentAvatarSrc(
    humanerAgentRecord?.image,
    humanerAgentRecord?.character ?? 'CORPORATE'
  );
  const humanerOrganizationName =
    humanerAgentRecord?.organization?.name?.trim() || 'Humaner';
  // Ask Humaner home mark is always the Humaner brand — never logo.dev monogram.
  const humanerOrganizationLogoUrl = brand.logo;

  const organization = userFromDb!.organization!;
  const industryVertical = organization.industry
    ? getVerticalConfig(organization.industry)
    : null;
  const askHumanerSuggestedTopics = pickSuggestedTopics(
    organization.verticalTopics.length > 0
      ? organization.verticalTopics
      : (industryVertical?.commonTopics ?? [])
  );
  const copilotEnabled = getPlanCapabilities(organization.tier, {
    frontierBetaEnabled: organization.frontierBetaEnabled
  }).copilot;

  const dashboardShell = (
    <>
      <SidebarRenderer
        profile={profile}
        workspaces={workspaces}
        messageUsage={messageUsage}
        orgTier={userFromDb!.organization!.tier ?? 'free'}
        frontierBetaEnabled={userFromDb!.organization!.frontierBetaEnabled}
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
          copilotEnabled={copilotEnabled}
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
        data-dashboard-shell="ready"
      >
        {!isOssDeployment() ? (
          <DataImprovementConsentGate
            privacyPolicyUrl={getPrivacyUrl()}
            showPrompt={showDataImprovementPrompt}
          />
        ) : null}
        {!isOssDeployment() ? (
          <FrontierBetaPromptGate showPrompt={showFrontierBetaPrompt} />
        ) : null}
        {!isOssDeployment() ? (
          <InboxConnectPromptGate showPrompt={showInboxConnectPrompt} />
        ) : null}
        <SidebarProvider>
          <OrgRealtimeBridge enabled={!isOssDeployment()} />
          <ComposeMailProvider inboxes={mailInboxes}>
            <DashboardDockProvider>
              <DockNotificationsProvider
                notifications={notifications}
                teamMembers={notificationTeamMembers}
                currentUserId={notificationCurrentUserId}
              >
                {!isOssDeployment() &&
                copilotEnabled &&
                humanerAgentPublicId ? (
                  <HumanerChatProvider
                    agentPublicId={humanerAgentPublicId}
                    agentAvatarUrl={humanerAgentAvatarUrl}
                    organizationName={humanerOrganizationName}
                    organizationLogoUrl={humanerOrganizationLogoUrl}
                    widgetColor={ASK_HUMANER_ACCENT}
                    dashboardVisitorId={dashboardVisitorId}
                    visitorMetadata={visitorMetadata}
                    suggestedTopics={askHumanerSuggestedTopics}
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
