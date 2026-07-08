'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  BotIcon,
  CheckIcon,
  CircleAlert,
  ClockIcon,
  Layers,
  SearchIcon
} from '@humaner/shared/icons';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { TicketList } from '@/components/dashboard/desk/ticket-list';
import type { HandoffTicketItem } from '@/data/handoff/get-handoff-tickets';
import { cn } from '@/lib/utils';

export type AIDeskClientProps = {
  tickets: HandoffTicketItem[];
  teamMembers: { id: string; name: string }[];
  currentUserId: string;
};

type FilterMode = 'all' | 'resolved' | 'pending' | 'escalated';

export function AIDeskClient({
  tickets,
  teamMembers,
  currentUserId
}: AIDeskClientProps): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<FilterMode>('all');

  const filteredTickets = React.useMemo(() => {
    let result = tickets;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.visitorEmail?.toLowerCase().includes(q) ||
          t.visitorCompany?.toLowerCase().includes(q)
      );
    }

    switch (filterMode) {
      case 'resolved':
        result = result.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
        break;
      case 'pending':
        result = result.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
        break;
      case 'escalated':
        result = result.filter((t) => t.routedTo === 'human');
        break;
    }

    return result;
  }, [tickets, search, filterMode]);

  const resolvedCount = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;
  const pendingCount = tickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
  ).length;
  const resolutionRate =
    tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0;

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<BotIcon className="size-8 text-muted-foreground" />}
        title="No AI Desk tickets yet"
        description="Low-priority tickets will be routed here automatically when clusters and runbooks are configured."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl leading-none">AI Desk</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tickets handled autonomously using clusters and runbooks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Resolution</span>
            <span className="font-mono text-sm font-semibold">{resolutionRate}%</span>
          </div>
        </div>
      </div>

      {/* Stats ribbon */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total"
          value={tickets.length}
          color="default"
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          color="green"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          color="amber"
        />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets by subject, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'pending', 'resolved', 'escalated'] as const).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={filterMode === mode ? 'default' : 'outline'}
              onClick={() => setFilterMode(mode)}
              className="capitalize"
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>

      {/* Ticket list with grouping */}
      <TicketList
        tickets={filteredTickets}
        variant="ai"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: 'default' | 'green' | 'amber';
}): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-mono text-xl font-semibold tabular-nums',
          color === 'green' && 'text-emerald-600 dark:text-emerald-400',
          color === 'amber' && 'text-amber-600 dark:text-amber-400'
        )}
      >
        {value}
      </p>
    </div>
  );
}
