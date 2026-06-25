import * as React from 'react';
import Link from 'next/link';
import { AlertCircleIcon, ArrowUpRightIcon } from 'lucide-react';

import { AgentMetricBars } from '@/components/dashboard/agents/agent-metric-bars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import type { AgentOverviewItem } from '@/data/agents/get-agents-overview';
import { CHARACTER_META } from '@/lib/character-presets';
import { cn } from '@/lib/utils';

export type AgentOverviewCardProps = {
  agent: AgentOverviewItem;
  className?: string;
};

export function AgentOverviewCard({
  agent,
  className
}: AgentOverviewCardProps): React.JSX.Element {
  const meta = CHARACTER_META[agent.character];

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="relative h-24 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meta.image}
          alt={meta.label}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 bg-background/80 backdrop-blur-sm"
        >
          {meta.label}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg leading-none">
              {agent.name}
            </h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {agent.role}
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground"
          >
            <Link href={`${Routes.Knowledge}?agent=${agent.id}`}>
              <ArrowUpRightIcon className="size-4" />
              <span className="sr-only">Open knowledge</span>
            </Link>
          </Button>
        </div>

        <div className="mt-4 border-t pt-4">
          <AgentMetricBars
            satisfaction={agent.metrics.satisfaction}
            expertise={agent.metrics.expertise}
          />
        </div>

        {agent.metrics.gaps.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertCircleIcon className="size-3.5 shrink-0" />
              What&apos;s lacking
            </div>
            <ul className="mt-2 space-y-1">
              {agent.metrics.gaps.map((gap) => (
                <li
                  key={gap}
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex gap-2 pt-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Link href={`${Routes.Knowledge}?agent=${agent.id}`}>
              Add knowledge
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex-1"
          >
            <Link href={Routes.Agents}>Configure</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
