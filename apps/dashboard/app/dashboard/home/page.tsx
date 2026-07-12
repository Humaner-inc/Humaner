import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BotIcon } from '@humaner/shared/icons';
import { getPlanForTier } from '@humaner/shared/plans';

import { AgentCard } from '@/components/dashboard/agents/agent-card';
import { DashboardOverviewStrip } from '@/components/dashboard/home/dashboard-overview-strip';
import { DeskIssuesOverviewCard } from '@/components/dashboard/home/desk-issues-overview-card';
import { TeamMembersOverviewCard } from '@/components/dashboard/home/team-members-overview-card';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { getAgentsOverview } from '@/data/agents/get-agents-overview';
import { getDeskIssuesOverview } from '@/data/desk/get-desk-issues-overview';
import { getOrganizationMembers } from '@/data/members/get-organization-members';
import { dedupedAuth } from '@/lib/auth';
import {
  getEffectiveAgentLimit,
  getLiveAgentCount,
  hasReachedAgentLimit,
  userBypassesPlanLimits
} from '@/lib/billing/plan-limits';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Organization')
};

export default async function HomePage(): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  const bypassLimits = session?.user?.id
    ? await userBypassesPlanLimits(session.user.id)
    : false;

  const [organization, agents, liveAgentCount, deskOverview, members] =
    await Promise.all([
      session?.user?.organizationId
        ? prisma.organization.findFirst({
            where: { id: session.user.organizationId },
            select: {
              name: true,
              website: true,
              industry: true,
              tier: true,
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
      getOrganizationMembers()
    ]);

  const plan = getPlanForTier(organization?.tier ?? 'free');
  const agentLimit = getEffectiveAgentLimit(plan, bypassLimits);
  const atLimit = hasReachedAgentLimit(liveAgentCount, plan, bypassLimits);

  return (
    <SectionPage width="lg">
      <div className="space-y-8">
        <DashboardOverviewStrip
          organizationName={organization?.name ?? 'Your organization'}
          website={organization?.website ?? null}
          logoUrl={organization?.logoUrl ?? null}
          industry={organization?.industry ?? null}
          targetAudience={organization?.targetAudience ?? null}
          tier={organization?.tier ?? 'free'}
        />

        <section className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                linkToWorkspace
              />
            ))}
            {!atLimit ? (
              <Link
                href={Routes.AgentNew}
                className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center transition-colors hover:border-foreground/20 hover:bg-muted/40"
              >
                <BotIcon className="mb-3 size-8 text-muted-foreground" />
                <span className="text-sm font-medium">Create agent</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Personality, knowledge, and policies
                </span>
              </Link>
            ) : null}
          </div>

          <p className="text-center text-[11px] tabular-nums text-muted-foreground">
            {bypassLimits
              ? `${agents.length} agent${agents.length === 1 ? '' : 's'} · no plan limits`
              : `${liveAgentCount} of ${agentLimit} live slot${agentLimit === 1 ? '' : 's'}`}
          </p>

          {atLimit ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              You&apos;ve reached your plan&apos;s live agent limit. Pause an
              agent or upgrade to create more.
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DeskIssuesOverviewCard overview={deskOverview} />
          <TeamMembersOverviewCard members={members} />
        </section>
      </div>
    </SectionPage>
  );
}
