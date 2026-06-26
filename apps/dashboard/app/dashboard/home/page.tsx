import * as React from 'react';
import type { Metadata } from 'next';
import { getPlanForTier } from '@humaner/shared/plans';
import { BarChart3Icon, BlocksIcon, BookOpenIcon } from '@humaner/shared/icons';

import { AgentCard } from '@/components/dashboard/agents/agent-card';
import { CreateAgentDialog } from '@/components/dashboard/agents/create-agent-dialog';
import { DashboardOverviewStrip } from '@/components/dashboard/home/dashboard-overview-strip';
import { QuickLinkCard } from '@/components/dashboard/home/quick-link-card';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { getAgentsOverview } from '@/data/agents/get-agents-overview';
import { dedupedAuth } from '@/lib/auth';
import {
  getEffectiveAgentLimit,
  hasReachedAgentLimit,
  userBypassesPlanLimits
} from '@/lib/billing/plan-limits';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Dashboard')
};

export default async function HomePage(): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  const bypassLimits = session?.user?.id
    ? await userBypassesPlanLimits(session.user.id)
    : false;

  const [organization, agents] = await Promise.all([
    session?.user?.organizationId
      ? prisma.organization.findFirst({
          where: { id: session.user.organizationId },
          select: {
            industry: true,
            tier: true
          }
        })
      : Promise.resolve(null),
    getAgentsOverview()
  ]);

  const plan = getPlanForTier(organization?.tier ?? 'free');
  const agentLimit = getEffectiveAgentLimit(plan, bypassLimits);
  const atLimit = hasReachedAgentLimit(agents.length, plan, bypassLimits);

  return (
    <SectionPage width="lg">
      <div className="space-y-8">
        <DashboardOverviewStrip
          industry={organization?.industry ?? null}
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
                  : `${agents.length} of ${agentLimit} agent${agentLimit === 1 ? '' : 's'} on the ${plan.name} plan.`}
              </p>
            </div>
            <CreateAgentDialog disabled={atLimit} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
              />
            ))}
            {!atLimit && <CreateAgentDialog asCard />}
          </div>

          {atLimit && (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              You&apos;ve reached your plan&apos;s agent limit. Upgrade to create
              more characters.
            </p>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <QuickLinkCard
            href={Routes.Knowledge}
            icon={BookOpenIcon}
            title="Knowledge"
            description="Ingest URLs, PDFs, and text for grounded answers."
          />
          <QuickLinkCard
            href={Routes.Integrations}
            icon={BlocksIcon}
            title="Integrations"
            description="Deploy agents on your site, app, and channels."
          />
          <QuickLinkCard
            href={Routes.Analytics}
            icon={BarChart3Icon}
            title="Analytics"
            description="Track volume, gaps, and resolution over time."
          />
        </section>
      </div>
    </SectionPage>
  );
}
