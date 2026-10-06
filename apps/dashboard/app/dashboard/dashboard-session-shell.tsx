import * as React from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { brand } from '@/brand.config';
import {
  isCreditsBillingModel,
  STARTER_CREDIT_USD
} from '@humaner/shared/credits';
import {
  getPlanCapabilities,
  getPlanForTier,
  isCloudFreePlan
} from '@humaner/shared/plans';
import { getPrivacyUrl } from '@humaner/shared/urls';
import { WorkspaceRole } from '@prisma/client';

import { HumanerChatProvider } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { BillingAccessBanner } from '@/components/dashboard/billing-access-banner';
import { DashboardCloudChrome } from '@/components/dashboard/dashboard-cloud-chrome';
import { DashboardDocumentTitle } from '@/components/dashboard/dashboard-document-title';
import { DashboardWorkspaceColumn } from '@/components/dashboard/dashboard-workspace-column';
import { DataImprovementConsentGate } from '@/components/dashboard/data-improvement-consent-gate';
import { DashboardDockProvider } from '@/components/dashboard/dock/dashboard-dock-context';
import { DashboardDockPanel } from '@/components/dashboard/dock/dashboard-dock-panel';
import { DockNotificationsProvider } from '@/components/dashboard/dock/dock-notifications-context';
import { ComposeMailProvider } from '@/components/dashboard/inbox/compose-mail-context';
import { InboxConnectPromptGate } from '@/components/dashboard/inbox/inbox-connect-prompt-gate';
import { OrgRealtimeBridge } from '@/components/dashboard/org-realtime-bridge';
import { MfaRecommendedBanner } from '@/components/dashboard/settings/account/security/mfa-required-banner';
import { WorkspaceBillingAccessProvider } from '@/components/dashboard/workspace-billing-access-context';
import { WorkspaceReadOnlyGate } from '@/components/dashboard/workspace-read-only-gate';
import { SidebarProvider } from '@/components/ui/sidebar';
import { agentPersonaRoute, Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { getAgents } from '@/data/agents/get-agents';
import { getCompanionTaskProposals } from '@/data/ask-humaner/get-companion-task-proposals';
import { getSidebarMessageUsage } from '@/data/billing/get-sidebar-message-usage';
import { getWorkspaceBillingAccess } from '@/data/billing/get-workspace-billing-access';
import { getMcpIntelligenceEnabled } from '@/data/developers/mcp-intelligence-mode';
import { getHandoffOpenCounts } from '@/data/handoff/get-handoff-open-count';
import { getCompanionWorkspaceRights } from '@/data/inbox/companion-rights';
import { getConnectorSummaries } from '@/data/inbox/get-connector-activity';
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
import { shouldRecommendMfa } from '@/lib/auth/recommend-mfa';
import { getLoginRedirect } from '@/lib/auth/redirect';
import {
  canAccessPageKey,
  requirePathAccessFromHeaders
} from '@/lib/auth/require-workspace-access';
import { checkAuthenticatedSession, checkSession } from '@/lib/auth/session';
import { VIRAL_BETA_STARTER_CREDIT_USD } from '@/lib/auth/viral-beta-constants';
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
      role: true,
      organizationMemberships: {
        select: {
          organizationId: true,
          workspaceRole: true,
          allowedPages: true
        }
      },
      viralBetaExpiresAt: true,
      tier: true,
      billingModel: true,
      xFollowCreditGrantedAt: true,
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
  const liveMembership =
    userFromDb?.organizationMemberships.find(
      (row) => row.organizationId === session.user.organizationId
    ) ?? null;
  const liveWorkspaceRole =
    liveMembership?.workspaceRole ?? WorkspaceRole.TEAMMATE;
  const liveAllowedPages = liveMembership?.allowedPages ?? [];

  if (!checkSession(session)) {
    if (!oss && !userFromDb?.completedOnboarding) {
      return redirect(Routes.Onboarding);
    }
    return redirect(Routes.NoWorkspace);
  }

  // Cloud: owners finish the paid wizard; teammates finish member onboarding.
  // Self-Host has no onboarding export — mark flags complete and continue.
  const isWorkspaceOwner = liveWorkspaceRole === WorkspaceRole.OWNER;
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
      workspaceRole: liveWorkspaceRole,
      allowedPages: liveAllowedPages
    },
    'desk'
  );
  const canInbox = canAccessPageKey(
    {
      role: userFromDb!.role,
      workspaceRole: liveWorkspaceRole,
      allowedPages: liveAllowedPages
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
  const billingAccessPromise = oss
    ? Promise.resolve({ readOnly: false, banner: null })
    : getWorkspaceBillingAccess(session.user.organizationId);

  const [
    profile,
    agents,
    workspaces,
    messageUsage,
    billingAccess,
    notificationsResult,
    inboxUnreadCount,
    handoffOpenCounts,
    mailInboxes,
    teamFeed,
    taskProposals,
    mcpIntelligenceEnabled,
    companionRights,
    connectors,
    showMfaRecommendation
  ] = await Promise.all([
    getProfile(),
    getAgents(),
    getWorkspaceSwitcherData(),
    oss ? Promise.resolve(emptyMessageUsage) : getSidebarMessageUsage(),
    billingAccessPromise,
    notificationsPromise,
    !canInbox ? Promise.resolve(0) : getMailUnreadCount(),
    canDesk
      ? getHandoffOpenCounts()
      : Promise.resolve({ humanOpen: 0, agentOpen: 0 }),
    !canInbox ? Promise.resolve([]) : getMailInboxes(),
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
      : getCompanionWorkspaceRights(),
    oss || !canInbox ? Promise.resolve([]) : getConnectorSummaries(),
    userFromDb
      ? shouldRecommendMfa(session.user.id, liveWorkspaceRole, userFromDb.role)
      : Promise.resolve(false)
  ]);
  const {
    items: notifications,
    teamMembers: notificationTeamMembers,
    currentUserId: notificationCurrentUserId
  } = notificationsResult;

  const showDataImprovementPrompt =
    liveWorkspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.organization!.dataImprovementConsent === null;
  // Custom gets the integration setup guide after onboarding instead; an inbox
  // dialog on top of it would land before they have an agent talking to us.
  const inboxPromptEligible =
    oss || getPlanCapabilities(userFromDb!.organization!.tier).hostedAgent;
  const creditsGrantedPending =
    isCreditsBillingModel(userFromDb!.organization!.billingModel) &&
    liveWorkspaceRole === WorkspaceRole.OWNER &&
    userFromDb!.inboxConnectPromptPending;
  // Launch grants $10; following @usehumaner unlocks the other $10 → $20 total.
  const creditsGrantedUsd = userFromDb!.xFollowCreditGrantedAt
    ? STARTER_CREDIT_USD
    : VIRAL_BETA_STARTER_CREDIT_USD;
  const showInboxConnectPrompt =
    !showDataImprovementPrompt &&
    (creditsGrantedPending ||
      (inboxPromptEligible &&
        liveWorkspaceRole === WorkspaceRole.OWNER &&
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
  const companionAgent =
    agents.length > 0 ? agents[agents.length - 1] : undefined;
  const companionCharacter = companionAgent?.character;

  const sidebarAgents = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    image: agent.image,
    character: agent.character,
    isPaused: agent.isPaused
  }));

  const dashboardShell = (
    <DashboardCloudChrome
      sections={!oss}
      profile={profile}
      topNav={{
        teamFeed,
        planName: getPlanForTier(userFromDb!.organization!.tier).name,
        audienceLabel: oss
          ? (userFromDb!.organization!.targetAudience ?? null)
          : null
      }}
      sidebar={{
        workspaces,
        messageUsage,
        orgTier: userFromDb!.organization!.tier ?? 'free',
        frontierBetaEnabled: userFromDb!.organization!.frontierBetaEnabled,
        inboxUnreadCount,
        handoffOpenCount: handoffOpenCounts.humanOpen,
        agentDeskOpenCount: handoffOpenCounts.agentOpen,
        mailInboxes,
        agents: sidebarAgents,
        companionHref:
          copilotEnabled && companionAgent
            ? agentPersonaRoute(companionAgent.id)
            : null,
        showCompanionUpgrade: isCloudFreePlan(
          userFromDb!.organization!.tier ?? 'free'
        ),
        connectors
      }}
    >
      {!oss && billingAccess.banner ? (
        <BillingAccessBanner access={billingAccess} />
      ) : null}
      {showMfaRecommendation ? (
        <MfaRecommendedBanner className="mx-4 mt-3 mb-0" />
      ) : null}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <WorkspaceBillingAccessProvider access={billingAccess}>
          <DashboardWorkspaceColumn
            profile={profile}
            orgTier={userFromDb!.organization!.tier ?? 'free'}
          >
            <WorkspaceReadOnlyGate>{children}</WorkspaceReadOnlyGate>
          </DashboardWorkspaceColumn>
        </WorkspaceBillingAccessProvider>
        <DashboardDockPanel
          workspaceName={companionOrganizationName}
          teamFeed={teamFeed}
        />
      </div>
    </DashboardCloudChrome>
  );

  return (
    <OrgModeProvider targetAudience={userFromDb!.organization!.targetAudience}>
      <div
        className="flex h-screen overflow-hidden bg-shell text-foreground"
        data-dashboard-shell="ready"
      >
        {!isOssDeployment() ? (
          <DataImprovementConsentGate
            privacyPolicyUrl={getPrivacyUrl()}
            showPrompt={showDataImprovementPrompt}
          />
        ) : null}
        <InboxConnectPromptGate
          showPrompt={showInboxConnectPrompt}
          variant={oss ? 'inbox' : creditsGrantedPending ? 'credits' : 'inbox'}
          creditsUsd={creditsGrantedUsd}
        />
        <SidebarProvider className="h-full min-h-0 flex-col">
          <DashboardDocumentTitle />
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
