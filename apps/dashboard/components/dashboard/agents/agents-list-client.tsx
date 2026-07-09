'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon } from '@humaner/shared/icons';

import { AgentCard } from '@/components/dashboard/agents/agent-card';
import { Button } from '@/components/ui/button';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import type { AgentOverviewItem } from '@/data/agents/get-agents-overview';

export type AgentsListClientProps = {
  agents: AgentOverviewItem[];
  canCreate: boolean;
};

export function AgentsListClient({
  agents,
  canCreate
}: AgentsListClientProps): React.JSX.Element {
  return (
    <SectionPage width="lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-none">Agents</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage characters, knowledge, runbooks, and escalation per agent.
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href={Routes.AgentNew}>
              <PlusIcon className="mr-1.5 size-4" />
              New agent
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            linkToWorkspace
          />
        ))}
      </div>
    </SectionPage>
  );
}
