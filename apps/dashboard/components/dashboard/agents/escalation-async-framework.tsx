'use client';

import * as React from 'react';
import { ClockIcon, Sparkles } from '@humaner/shared/icons';

import { Badge } from '@/components/ui/badge';
import {
  ESCALATION_ASYNC_TIERS,
  ESCALATION_MODE_B2B_NOTES,
  ESCALATION_MODE_B2C_NOTES
} from '@/lib/desk/escalation-async-framework';
import type { EscalationPolicyItem } from '@/lib/desk/types';
import { useOrgMode } from '@/hooks/use-org-mode';
import { cn } from '@/lib/utils';

export type EscalationAsyncFrameworkProps = {
  policies: EscalationPolicyItem[];
};

export function EscalationAsyncFramework({
  policies
}: EscalationAsyncFrameworkProps): React.JSX.Element {
  const { isB2B, isB2C, mode } = useOrgMode();
  const activeModes = new Set(policies.map((policy) => policy.mode));
  const modeNotes = isB2B && !isB2C ? ESCALATION_MODE_B2B_NOTES : ESCALATION_MODE_B2C_NOTES;

  return (
    <section className="space-y-3 rounded-xl border bg-muted/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
            Async escalation framework
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Not every escalation needs a live human. Tier by urgency mode so
            {isB2B && isB2C
              ? ' B2C volume and B2B account stakes both get the right SLA.'
              : isB2B
                ? ' high-value accounts get live handoff while routine issues stay async.'
                : ' high-volume widget traffic resolves fast without burning agent capacity.'}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {mode === 'hybrid' ? 'B2C + B2B' : mode}
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Mode</th>
              <th className="pb-2 pr-3 font-medium">When it triggers</th>
              <th className="pb-2 pr-3 font-medium">SLA</th>
              <th className="pb-2 font-medium">Human action</th>
            </tr>
          </thead>
          <tbody>
            {ESCALATION_ASYNC_TIERS.map((tier) => {
              const isActive = activeModes.has(tier.mode);
              return (
                <tr
                  key={tier.mode}
                  className={cn(
                    'border-b border-border/50 last:border-0',
                    isActive && 'bg-background/60'
                  )}
                >
                  <td className="py-3 pr-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tier.label}</span>
                      {isActive ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Active
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      {modeNotes[tier.mode]}
                    </p>
                  </td>
                  <td className="py-3 pr-3 align-top text-muted-foreground">
                    {tier.trigger}
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <ClockIcon className="size-3" />
                      {tier.sla}
                    </span>
                  </td>
                  <td className="py-3 align-top text-muted-foreground">
                    {tier.humanAction}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
