import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, HeadsetIcon } from '@humaner/shared/icons';
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
      className={cn('flex flex-col rounded-xl border bg-card p-5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <HeadsetIcon className="size-5 shrink-0 text-foreground" />
          <div>
            <h2 className="font-display text-lg leading-none">Desk issues</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {needsAttention > 0
                ? `${needsAttention} ticket${needsAttention === 1 ? '' : 's'} need attention`
                : counts.total > 0
                  ? 'No open tickets right now'
                  : 'No desk tickets yet'}
            </p>
          </div>
        </div>
        <Link
          href={Routes.DeskHuman}
          className="group inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Open desk
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatPill
          label="Open"
          value={counts.open}
          tone="warning"
        />
        <StatPill
          label="In progress"
          value={counts.inProgress}
          tone="info"
        />
        <StatPill
          label="Resolved"
          value={counts.resolved + counts.closed}
          tone="success"
        />
      </div>

      <div className="mt-5 flex-1">
        {activeTickets.length > 0 ? (
          <ul className="m-0 list-none divide-y rounded-lg border p-0">
            {activeTickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={Routes.DeskHuman}
                  className={cn(
                    'flex items-start gap-3 border-l-2 px-3 py-2.5 transition-colors hover:bg-muted/40',
                    URGENCY_CLASS[ticket.urgency] ?? 'border-l-border'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {ticket.subject}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {ticket.agentName} ·{' '}
                      {formatDistanceToNow(new Date(ticket.updatedAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[11px]"
                  >
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {counts.total > 0
              ? 'All tickets are resolved or closed.'
              : 'Escalated conversations will appear here once agents hand off to your team.'}
          </div>
        )}
      </div>
    </section>
  );
}

function StatPill({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: 'warning' | 'info' | 'success';
}): React.JSX.Element {
  const toneClass = {
    warning: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
    info: 'bg-violet-500/10 text-violet-800 dark:text-violet-300',
    success: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
  }[tone];

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 font-display text-2xl tabular-nums', toneClass)}>
        {value}
      </p>
    </div>
  );
}
