import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckIcon } from '@humaner/shared/icons';
import { formatDistanceToNow } from 'date-fns';

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader
} from '@/components/ui/dashboard-card';
import { MetricCell, MetricRow } from '@/components/ui/metric-cell';
import { StatusTag } from '@/components/ui/micro-label';
import { Routes } from '@/constants/routes';
import type { DeskIssuesOverview } from '@/data/desk/get-desk-issues-overview';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress'
};

function DeskStatusIcon({
  status
}: {
  status: 'open' | 'inProgress' | 'resolved';
}): React.JSX.Element {
  if (status === 'open') {
    return (
      <span
        className="inline-flex size-3.5 shrink-0 items-center justify-center text-blue-500"
        aria-hidden
      >
        <span className="size-2 rounded-full border-[1.5px] border-current" />
      </span>
    );
  }

  if (status === 'inProgress') {
    return (
      <span
        className="inline-flex size-3.5 shrink-0 items-center justify-center text-amber-500"
        aria-hidden
      >
        <span className="block h-0.5 w-2.5 rounded-full bg-current" />
      </span>
    );
  }

  return (
    <CheckIcon
      className="size-3.5 shrink-0 text-emerald-500"
      aria-hidden
    />
  );
}

function DeskStatusMetricLabel({
  status,
  label
}: {
  status: 'open' | 'inProgress' | 'resolved';
  label: string;
}): React.JSX.Element {
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      <DeskStatusIcon status={status} />
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

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
    <DashboardCard className={className}>
      <DashboardCardHeader
        title="Desk"
        count={needsAttention > 0 ? `${needsAttention} active` : undefined}
        action={
          <Link
            href={Routes.DeskHuman}
            className="group inline-flex shrink-0 items-center gap-1 font-mono text-[10px] tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Open
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        }
      />

      <MetricRow className="grid-cols-3">
        <MetricCell
          label={
            <DeskStatusMetricLabel
              status="open"
              label="Open"
            />
          }
          value={counts.open}
        />
        <MetricCell
          label={
            <DeskStatusMetricLabel
              status="inProgress"
              label="Progress"
            />
          }
          value={counts.inProgress}
        />
        <MetricCell
          label={
            <DeskStatusMetricLabel
              status="resolved"
              label="Solved"
            />
          }
          value={counts.resolved + counts.closed}
        />
      </MetricRow>

      <DashboardCardBody>
        {activeTickets.length > 0 ? (
          <ul className="m-0 list-none divide-y divide-border/50 overflow-hidden border p-0">
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
                  <StatusTag className="shrink-0">
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </StatusTag>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
            {counts.total > 0
              ? 'No open tickets.'
              : 'Handoffs from agents appear here.'}
          </p>
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
}
