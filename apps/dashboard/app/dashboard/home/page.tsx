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
  const slotLabel = bypassLimits
    ? `${agents.length} agent${agents.length === 1 ? '' : 's'}`
    : `${liveAgentCount}/${agentLimit} live`;

  return (
    <SectionPage width="xl">
      <div className="space-y-6">
        <DashboardOverviewStrip
          organizationName={organization?.name ?? 'Your organization'}
          website={organization?.website ?? null}
          logoUrl={organization?.logoUrl ?? null}
          industry={organization?.industry ?? null}
          targetAudience={organization?.targetAudience ?? null}
          tier={organization?.tier ?? 'free'}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] xl:items-start">
          <section className="min-w-0 space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-mono text-sm font-medium leading-none">
                Agents
                <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
                  {slotLabel}
                </span>
              </h2>
              {!atLimit ? (
                <Link
                  href={Routes.AgentNew}
                  className="shrink-0 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  New agent
                </Link>
              ) : null}
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  linkToWorkspace
                  compact
                />
              ))}
              {!atLimit ? (
                <Link
                  href={Routes.AgentNew}
                  className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/15 p-4 text-center transition-colors hover:border-foreground/20 hover:bg-muted/30"
                >
                  <BotIcon className="mb-2 size-6 text-muted-foreground" />
                  <span className="font-mono text-xs font-medium">
                    Create agent
                  </span>
                </Link>
              ) : null}
            </div>

            {atLimit ? (
              <p className="rounded-lg border border-dashed border-border/60 px-4 py-3 text-center text-xs text-muted-foreground">
                Live agent limit reached. Pause an agent or upgrade your plan.
              </p>
            ) : null}
          </section>

          <aside className="space-y-3 xl:sticky xl:top-4">
            <DeskIssuesOverviewCard overview={deskOverview} />
            <TeamMembersOverviewCard members={members} />
          </aside>
        </div>
      </div>
    </SectionPage>
  );
}
