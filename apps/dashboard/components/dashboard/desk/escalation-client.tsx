'use client';

import * as React from 'react';
import {
  PlusIcon,
  ShieldIcon
} from '@humaner/shared/icons';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

type PolicyStub = {
  id: string;
  name: string;
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  mode: 'LIVE' | 'PRIORITY' | 'STANDARD' | 'SELF_RESOLVING';
  slaMinutes: number | null;
  routeToKnowledgeAreas: string[];
  isDefault: boolean;
};

const MODE_LABELS: Record<string, { label: string; description: string }> = {
  LIVE: {
    label: 'Live',
    description: 'Real-time handoff, human responds immediately'
  },
  PRIORITY: {
    label: 'Priority',
    description: 'Async reply within SLA window'
  },
  STANDARD: {
    label: 'Standard',
    description: 'Async reply, flexible timeline'
  },
  SELF_RESOLVING: {
    label: 'Self-resolving',
    description: 'Knowledge gap detected, auto-draft answer'
  }
};

const URGENCY_COLORS: Record<string, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-amber-500',
  LOW: 'border-l-emerald-500'
};

export function EscalationClient(): React.JSX.Element {
  const [policies] = React.useState<PolicyStub[]>([]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl leading-none">Escalation Policies</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Define how tickets are handled based on urgency. Route to the right people with the right SLA.
          </p>
        </div>
        <Button size="sm">
          <PlusIcon className="mr-1.5 size-4" />
          New policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <EmptyState
          icon={<ShieldIcon className="size-8 text-muted-foreground" />}
          title="No escalation policies"
          description="Define policies per urgency level to control routing, SLA, and async vs live resolution modes."
        >
          <div className="mt-4">
            <Button size="sm">
              <PlusIcon className="mr-1.5 size-4" />
              Create default policies
            </Button>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      )}

      {/* Mode reference */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-medium">Escalation modes</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {Object.entries(MODE_LABELS).map(([key, { label, description }]) => (
            <div key={key} className="rounded-md border bg-card px-3 py-2">
              <p className="text-xs font-medium">{label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ policy }: { policy: PolicyStub }): React.JSX.Element {
  const modeInfo = MODE_LABELS[policy.mode] ?? MODE_LABELS.STANDARD;

  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 border-l-[3px] bg-card p-4',
        URGENCY_COLORS[policy.urgencyLevel] ?? URGENCY_COLORS.MEDIUM
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">{policy.name}</h4>
            {policy.isDefault && (
              <Badge variant="secondary" className="text-[10px]">
                Default
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {modeInfo.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className="text-[10px] capitalize">
            {policy.urgencyLevel.toLowerCase()}
          </Badge>
          {policy.slaMinutes && (
            <span className="text-[10px] text-muted-foreground">
              SLA: {policy.slaMinutes}min
            </span>
          )}
        </div>
      </div>
      {policy.routeToKnowledgeAreas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {policy.routeToKnowledgeAreas.map((area) => (
            <Badge key={area} variant="outline" className="text-[10px]">
              {area}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
