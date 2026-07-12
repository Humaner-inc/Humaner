import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from '@humaner/shared/icons';
import { formatDistanceToNow } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Routes } from '@/constants/routes';
import type { DeskIssuesOverview } from '@/data/desk/get-desk-issues-overview';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress'
};

const URGENCY_CLASS: Record<string, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-amber-500',
  LOW: 'border-l-emerald-500'
};

export type DeskIssuesOverviewCardProps = {
  overview: DeskIssuesOverview;
  className?: string;
};

export function DeskIssuesOverviewCard({
  overview,
  className
}: DeskIssuesOverviewCardProps): React.JSX.Element {
  const { counts, activeTickets } = overview;
  const needsAttention = counts.open + counts.inProgress;

  return (
    <section
      className={cn('rounded-xl border border-border/60 bg-card', className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
        <h2 className="font-mono text-sm font-medium leading-none">
          Desk
          {needsAttention > 0 ? (
            <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
              {needsAttention} active
            </span>
          ) : null}
        </h2>
        <Link
          href={Routes.DeskHuman}
          className="group inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Open
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/50">
        <StatCell
          label="Open"
          value={counts.open}
        />
        <StatCell
          label="In progress"
          value={counts.inProgress}
        />
        <StatCell
          label="Resolved"
          value={counts.resolved + counts.closed}
        />
      </div>

      <div className="p-3">
        {activeTickets.length > 0 ? (
          <ul className="m-0 list-none divide-y divide-border/50 overflow-hidden rounded-lg border p-0">
            {activeTickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={Routes.DeskHuman}
                  className={cn(
                    'flex items-start gap-3 border-l-2 px-2 py-2 transition-colors hover:bg-muted/30',
                    URGENCY_CLASS[ticket.urgency] ?? 'border-l-border'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{ticket.subject}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {ticket.agentName} ·{' '}
                      {formatDistanceToNow(new Date(ticket.updatedAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px]"
                  >
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
            {counts.total > 0
              ? 'No open tickets.'
              : 'Handoffs from agents appear here.'}
          </p>
        )}
      </div>
    </section>
  );
}

function StatCell({
  label,
  value
}: {
  label: string;
  value: number;
}): React.JSX.Element {
  return (
    <div className="px-3 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl tabular-nums leading-none">
        {value}
      </p>
    </div>
  );
}
