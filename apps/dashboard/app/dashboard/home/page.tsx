import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3Icon,
  BlocksIcon,
  BotIcon,
  PlusIcon
} from '@humaner/shared/icons';
import { getPlanForTier } from '@humaner/shared/plans';

import { AgentCard } from '@/components/dashboard/agents/agent-card';
import { DashboardOverviewStrip } from '@/components/dashboard/home/dashboard-overview-strip';
import { QuickLinkCard } from '@/components/dashboard/home/quick-link-card';
import { Button } from '@/components/ui/button';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes, integrationChannelRoute } from '@/constants/routes';
import { getAgentsOverview } from '@/data/agents/get-agents-overview';
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

  const [organization, agents, liveAgentCount] = await Promise.all([
    session?.user?.organizationId
      ? prisma.organization.findFirst({
          where: { id: session.user.organizationId },
          select: {
            name: true,
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
      : Promise.resolve(0)
  ]);

  const plan = getPlanForTier(organization?.tier ?? 'free');
  const agentLimit = getEffectiveAgentLimit(plan, bypassLimits);
  const atLimit = hasReachedAgentLimit(liveAgentCount, plan, bypassLimits);

  return (
    <SectionPage width="lg">
      <div className="space-y-8">
        <DashboardOverviewStrip
          organizationName={organization?.name ?? 'Your organization'}
          logoUrl={organization?.logoUrl ?? null}
          industry={organization?.industry ?? null}
          targetAudience={organization?.targetAudience ?? null}
          tier={organization?.tier ?? 'free'}
        />

        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl leading-none">
                Your agents
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {bypassLimits
                  ? `${agents.length} agent${agents.length === 1 ? '' : 's'} · Admin — no plan limits`
                  : `${liveAgentCount} of ${agentLimit} live slot${agentLimit === 1 ? '' : 's'} on the ${plan.name} plan.`}
              </p>
            </div>
            {!atLimit ? (
              <Button asChild>
                <Link href={Routes.AgentNew}>
                  <PlusIcon className="mr-1.5 size-4" />
                  New agent
                </Link>
              </Button>
            ) : null}
          </div>

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
                  Full-page setup with personality, knowledge, and policies
                </span>
              </Link>
            ) : null}
          </div>

          {atLimit && (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              You&apos;ve reached your plan&apos;s live agent limit. Pause an agent
              or upgrade to create more.
            </p>
          )}

          <div className="flex justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href={Routes.Agents}>Manage all agents</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <QuickLinkCard
            href={Routes.Agents}
            icon={BotIcon}
            title="Agents"
            description="Personality, knowledge, runbooks, and escalation per agent."
          />
          <QuickLinkCard
            href={integrationChannelRoute('rest-api')}
            icon={BlocksIcon}
            title="Integrations"
            description="Deploy agents on your site, app, and channels."
          />
          <QuickLinkCard
            href={Routes.Desk}
            icon={BarChart3Icon}
            title="Desk"
            description="AI and human inbox, clusters, and team routing."
          />
        </section>
      </div>
    </SectionPage>
  );
}
