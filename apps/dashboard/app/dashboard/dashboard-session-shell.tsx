import * as React from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { brand } from '@/brand.config';
import { isCreditsBillingModel } from '@humaner/shared/credits';
import {
  getPlanCapabilities,
  getPlanForTier,
  isCloudFreePlan
} from '@humaner/shared/plans';
import { getPrivacyUrl } from '@humaner/shared/urls';
import { WorkspaceRole } from '@prisma/client';

import { HumanerChatProvider } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { DashboardTopNav } from '@/components/dashboard/dashboard-top-nav';
import { DashboardWorkspaceColumn } from '@/components/dashboard/dashboard-workspace-column';
import { DataImprovementConsentGate } from '@/components/dashboard/data-improvement-consent-gate';
import { DashboardDockProvider } from '@/components/dashboard/dock/dashboard-dock-context';
import { DashboardDockPanel } from '@/components/dashboard/dock/dashboard-dock-panel';
import { DockNotificationsProvider } from '@/components/dashboard/dock/dock-notifications-context';
import { ComposeMailProvider } from '@/components/dashboard/inbox/compose-mail-context';
import { InboxConnectPromptGate } from '@/components/dashboard/inbox/inbox-connect-prompt-gate';
import { OrgRealtimeBridge } from '@/components/dashboard/org-realtime-bridge';
import { SidebarRenderer } from '@/components/dashboard/sidebar-renderer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { getAgents } from '@/data/agents/get-agents';
import { getCompanionTaskProposals } from '@/data/ask-humaner/get-companion-task-proposals';
import { getSidebarMessageUsage } from '@/data/billing/get-sidebar-message-usage';
import { getMcpIntelligenceEnabled } from '@/data/developers/mcp-intelligence-mode';
import { getHandoffOpenCounts } from '@/data/handoff/get-handoff-open-count';
import { getCompanionWorkspaceRights } from '@/data/inbox/companion-rights';
import {
  getMailInboxes,
  getMailUnreadCount
} from '@/data/inbox/get-mail-threads';
import { getDashboardNotifications } from '@/data/notifications/get-dashboard-notifications';
import { getTeamWorkspaceFeed } from '@/data/team/get-team-workspace';
import { getWorkspaceSwitcherData } from '@/data/workspaces/get-workspace-switcher-data';
import { OrgModeProvider } from '@/hooks/use-org-mode';
import { COMPANION_STARTER_TOPICS } from '@/lib/ask-humaner/companion-starter-topics';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import {
  canAccessPageKey,
  requirePathAccessFromHeaders
} from '@/lib/auth/require-workspace-access';
import { checkAuthenticatedSession, checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { buildDashboardVisitorId } from '@/lib/humaner-support-agent';
import { ASK_HUMANER_ACCENT } from '@/lib/urls/extract-brand-accent-color';
import { COMPANION_TASK_PROPOSALS_ENABLED } from '@/types/companion-task-proposal';
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
      viralBetaExpiresAt: true,
      tier: true,
      billingModel: true,
      organization: {
        select: {
          completedOnboarding: true,
          dataImprovementConsent: true,
          targetAudience: true,
          tier: true,
          billingModel: true,
          frontierBetaEnabled: true,
          accentColor: true,
          name: true,
          _count: {
            select: { mailboxConnections: true }
          }
        }
      }
    }
  });

  const oss = isOssDeployment();

  if (!checkSession(session)) {
    if (!oss && !userFromDb?.completedOnboarding) {
      return redirect(Routes.Onboarding);
    }
    return redirect(Routes.NoWorkspace);
  }

  // Cloud: owners finish the paid wizard; teammates finish member onboarding.
  // Self-Host has no onboarding export — mark flags complete and continue.
  const isWorkspaceOwner = userFromDb!.workspaceRole === WorkspaceRole.OWNER;
  if (
    !userFromDb!.completedOnboarding ||
    (isWorkspaceOwner && !userFromDb!.organization!.completedOnboarding)
  ) {
    if (oss) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { completedOnboarding: true }
        }),
        ...(userFromDb!.organization
          ? [
              prisma.organization.update({
                where: { id: session.user.organizationId },
                data: { completedOnboarding: true }
              })
            ]
          : [])
      ]);
    } else {
      return redirect(Routes.Onboarding);
    }
  }

  await requirePathAccessFromHeaders();
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
    creditsUsedCents: 0,
    creditsIncludedCents: 0,
    creditsRemainingCents: 0,
    billingModel: 'subscription',
    tier: userFromDb!.organization!.tier ?? 'free',
    operatorOwnedQuota: false
  };
  const notificationsPromise = getDashboardNotifications();
  const [
    profile,
    agents,
    workspaces,
    messageUsage,
    notificationsResult,
    inboxUnreadCount,
    handoffOpenCounts,
    mailInboxes,
    teamFeed,
    taskProposals,
    mcpIntelligenceEnabled,
    companionRights
  ] = await Promise.all([
    getProfile(),
    getAgents(),
    getWorkspaceSwitcherData(),
    oss ? Promise.resolve(emptyMessageUsage) : getSidebarMessageUsage(),
    notificationsPromise,
    oss || !canInbox ? Promise.resolve(0) : getMailUnreadCount(),
    canDesk
      ? getHandoffOpenCounts()
      : Promise.resolve({ humanOpen: 0, agentOpen: 0 }),
    oss || !canInbox ? Promise.resolve([]) : getMailInboxes(),
    oss || !canInbox
      ? Promise.resolve({ notes: [], messages: [] })
      : getTeamWorkspaceFeed(),
    oss || !COMPANION_TASK_PROPOSALS_ENABLED
      ? Promise.resolve([])
      : notificationsPromise.then((result) =>
          getCompanionTaskProposals(result.items)
        ),
    oss ? Promise.resolve(false) : getMcpIntelligenceEnabled(),
    oss
      ? Promise.resolve({
          actions: ['DRAFT' as const],
          integrations: [],
          actionSuggestions: true
        })
      : getCompanionWorkspaceRights()
  ]);
  const {
    items: notifications,
    teamMembers: notificationTeamMembers,
    currentUserId: notificationCurrentUserId
  } = notificationsResult;

  const showDataImprovementPrompt =
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.organization!.dataImprovementConsent === null;
  // Custom gets the integration setup guide after onboarding instead; an inbox
  // dialog on top of it would land before they have an agent talking to us.
  const inboxPromptEligible = getPlanCapabilities(
    userFromDb!.organization!.tier
  ).hostedAgent;
  const creditsGrantedPending =
    isCreditsBillingModel(userFromDb!.organization!.billingModel) &&
    userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.inboxConnectPromptPending;
  const showInboxConnectPrompt =
    !showDataImprovementPrompt &&
    (creditsGrantedPending ||
      (inboxPromptEligible &&
        userFromDb!.workspaceRole === WorkspaceRole.OWNER &&
        userFromDb!.inboxConnectPromptPending &&
        getPlanForTier(userFromDb!.organization!.tier).mailboxAliases > 0 &&
        userFromDb!.organization!._count.mailboxConnections === 0));

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

  const companionOrganizationName =
    userFromDb!.organization!.name?.trim() || 'Workspace';
  const companionOrganizationLogoUrl = brand.logo;

  const organization = userFromDb!.organization!;
  const askHumanerSuggestedTopics = companionRights.actionSuggestions
    ? [...COMPANION_STARTER_TOPICS]
    : [];
  // MCP intelligence and Companion are mutually exclusive: when a workspace
  // hands the intelligence layer to its own agent over MCP, hide Companion.
  const copilotEnabled =
    getPlanCapabilities(organization.tier, {
      frontierBetaEnabled: organization.frontierBetaEnabled
    }).copilot && !mcpIntelligenceEnabled;

  // Companion mirrors the persona the workspace configured on its primary
  // (oldest) agent. getAgents() orders desc, so that's the last item.
  const companionCharacter =
    agents.length > 0 ? agents[agents.length - 1].character : undefined;

  const sidebarAgents = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    image: agent.image,
    character: agent.character,
    isPaused: agent.isPaused
  }));

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
        mailInboxes={mailInboxes}
        agents={sidebarAgents}
        companionHref={copilotEnabled ? Routes.Knowledge : null}
        showCompanionUpgrade={isCloudFreePlan(
          userFromDb!.organization!.tier ?? 'free'
        )}
      />
      <SidebarInset
        id="skip"
        className="min-h-0 min-w-0 flex-1"
      >
        <DashboardTopNav
          profile={profile}
          workspaces={workspaces}
          teamFeed={teamFeed}
          planName={getPlanForTier(userFromDb!.organization!.tier).name}
          audienceLabel={
            oss ? (userFromDb!.organization!.targetAudience ?? null) : null
          }
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <DashboardWorkspaceColumn
            profile={profile}
            orgTier={userFromDb!.organization!.tier ?? 'free'}
          >
            {children}
          </DashboardWorkspaceColumn>
          <DashboardDockPanel
            workspaceName={companionOrganizationName}
            teamFeed={teamFeed}
          />
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
          <InboxConnectPromptGate
            showPrompt={showInboxConnectPrompt}
            variant={creditsGrantedPending ? 'credits' : 'inbox'}
          />
        ) : null}
        <SidebarProvider>
          <OrgRealtimeBridge />
          <ComposeMailProvider
            inboxes={mailInboxes}
            workspaceId={session.user.organizationId ?? ''}
          >
            <DashboardDockProvider>
              <DockNotificationsProvider
                notifications={notifications}
                teamMembers={notificationTeamMembers}
                currentUserId={notificationCurrentUserId}
              >
                {!isOssDeployment() && copilotEnabled ? (
                  <HumanerChatProvider
                    companionScope={session.user.organizationId}
                    companionCharacter={companionCharacter}
                    organizationName={companionOrganizationName}
                    organizationLogoUrl={companionOrganizationLogoUrl}
                    widgetColor={ASK_HUMANER_ACCENT}
                    dashboardVisitorId={dashboardVisitorId}
                    visitorMetadata={visitorMetadata}
                    suggestedTopics={askHumanerSuggestedTopics}
                    actionSuggestionsEnabled={companionRights.actionSuggestions}
                    taskProposals={taskProposals}
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
