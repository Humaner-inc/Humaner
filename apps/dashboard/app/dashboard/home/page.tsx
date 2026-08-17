import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { formatAgents, getEffectivePlan } from '@humaner/shared/plans';

import { AgentCard } from '@/components/dashboard/agents/agent-card';
import { CreateAgentCard } from '@/components/dashboard/home/create-agent-card';
import { DashboardOverviewStrip } from '@/components/dashboard/home/dashboard-overview-strip';
import { DeskIssuesOverviewCard } from '@/components/dashboard/home/desk-issues-overview-card';
import { InboxOverviewCard } from '@/components/dashboard/home/inbox-overview-card';
import { TeamMembersOverviewCard } from '@/components/dashboard/home/team-members-overview-card';
import { SectionPage } from '@/components/ui/section-shell';
import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { getAgentsOverview } from '@/data/agents/get-agents-overview';
import { getDeskIssuesOverview } from '@/data/desk/get-desk-issues-overview';
import { getInboxHomeOverview } from '@/data/inbox/get-inbox-home-overview';
import { getOrganizationMembers } from '@/data/members/get-organization-members';
import { dedupedAuth } from '@/lib/auth';
import { canAccessPathname } from '@/lib/auth/workspace-access';
import {
  getEffectiveAgentLimit,
  getLiveAgentCount,
  hasReachedAgentLimit,
  userBypassesPlanLimits
} from '@/lib/billing/plan-limits';
import { dashboardSurfaceDashedClassName } from '@/lib/dashboard/surface-styles';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';
import { getBusinessLogoUrl } from '@/lib/urls/get-business-logo-url';
import { cn } from '@/lib/utils';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.Home,
  'Organization'
);

function HomePageFallback(): React.JSX.Element {
  return (
    <SectionPage width="xl">
      <div
        className="space-y-6"
        data-dashboard-page-shell="organization"
      >
        <div className="h-24 animate-pulse rounded-md bg-muted/40" />
        <h2 className="section-title">Agents</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
          <div className="h-36 animate-pulse rounded-md bg-muted/40" />
          <div className="h-36 animate-pulse rounded-md bg-muted/40" />
        </div>
      </div>
    </SectionPage>
  );
}

async function HomePageContent(): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  const oss = isOssDeployment();

  const [
    profile,
    bypassLimits,
    organization,
    agents,
    liveAgentCount,
    deskOverview,
    members,
    inboxOverview
  ] = await Promise.all([
    getProfile(),
    session?.user?.id
      ? userBypassesPlanLimits(session.user.id)
      : Promise.resolve(false),
    session?.user?.organizationId
      ? prisma.organization.findFirst({
          where: { id: session.user.organizationId },
          select: {
            name: true,
            website: true,
            industry: true,
            tier: true,
            includedMessages: true,
            targetAudience: true,
            logoUrl: true
          }
        })
      : Promise.resolve(null),
    getAgentsOverview(),
    session?.user?.organizationId
      ? getLiveAgentCount(session.user.organizationId)
      : Promise.resolve(0),
    getDeskIssuesOverview(),
    getOrganizationMembers(),
    oss ? Promise.resolve(null) : getInboxHomeOverview()
  ]);

  const plan = getEffectivePlan(
    organization?.tier ?? 'free',
    organization?.includedMessages
  );
  const agentLimit = getEffectiveAgentLimit(plan, bypassLimits);
  const atLimit = hasReachedAgentLimit(liveAgentCount, plan, bypassLimits);
  const slotLabel = bypassLimits
    ? `${agents.length} agent${agents.length === 1 ? '' : 's'}`
    : `${liveAgentCount}/${formatAgents(agentLimit) === 'Unlimited' ? '∞' : agentLimit} live`;

  return (
    <SectionPage width="xl">
      <div className="space-y-6">
        <DashboardOverviewStrip
          organizationName={organization?.name ?? 'Your organization'}
          website={organization?.website ?? null}
          logoUrl={
            getBusinessLogoUrl(organization?.website, {
              logoUrl: organization?.logoUrl,
              size: 128
            }) ??
            organization?.logoUrl ??
            null
          }
          industry={organization?.industry ?? null}
          targetAudience={organization?.targetAudience ?? null}
          tier={organization?.tier ?? 'free'}
          includedMessages={organization?.includedMessages}
          canAccessBilling={!oss && canAccessPathname(profile, Routes.Billing)}
          selfHostMode={oss}
        />

        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="section-title">
              Agents
              <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
                {slotLabel}
              </span>
            </h2>
            {!atLimit ? (
              <Link
                href={Routes.AgentNew}
                className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                New agent
              </Link>
            ) : null}
          </div>

          {oss ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    linkToWorkspace
                    compact
                  />
                ))}
                {!atLimit ? <CreateAgentCard /> : null}
              </div>
              {atLimit ? (
                <p
                  className={cn(
                    dashboardSurfaceDashedClassName,
                    'px-4 py-3 text-center text-xs text-muted-foreground'
                  )}
                >
                  Agent limit reached for this workspace.
                </p>
              ) : null}
            </>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:items-start">
              <div className="min-w-0 space-y-4">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
                  {agents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      linkToWorkspace
                      compact
                    />
                  ))}
                  {!atLimit ? <CreateAgentCard /> : null}
                </div>
                {atLimit ? (
                  <p
                    className={cn(
                      dashboardSurfaceDashedClassName,
                      'px-4 py-3 text-center text-xs text-muted-foreground'
                    )}
                  >
                    Live agent limit reached. Pause an agent or upgrade your
                    plan.
                  </p>
                ) : null}
              </div>
              <aside className="lg:sticky lg:top-4">
                <TeamMembersOverviewCard members={members} />
              </aside>
            </div>
          )}
        </section>

        {oss ? (
          <section className="grid gap-4 md:grid-cols-2">
            <DeskIssuesOverviewCard
              overview={deskOverview}
              title={AppInfo.HELPDESK_LABEL}
            />
            <TeamMembersOverviewCard members={members} />
          </section>
        ) : (
          <section
            className={cn(
              'grid gap-4',
              inboxOverview ? 'md:grid-cols-2' : 'md:grid-cols-1'
            )}
          >
            <DeskIssuesOverviewCard overview={deskOverview} />
            {inboxOverview ? (
              <InboxOverviewCard overview={inboxOverview} />
            ) : null}
          </section>
        )}
      </div>
    </SectionPage>
  );
}

export default function HomePage(): React.JSX.Element {
  return (
    <React.Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </React.Suspense>
  );
}
