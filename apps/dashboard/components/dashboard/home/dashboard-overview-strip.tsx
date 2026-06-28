import * as React from 'react';
import type { IndustryType } from '@prisma/client';
import { getPlanForTier } from '@humaner/shared/plans';
import Link from 'next/link';

import { IndustryTag } from '@/components/dashboard/home/industry-tag';
import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export type DashboardOverviewStripProps = {
  industry: IndustryType | null;
  tier: string;
  className?: string;
};

export function DashboardOverviewStrip({
  industry,
  tier,
  className
}: DashboardOverviewStripProps): React.JSX.Element {
  const plan = getPlanForTier(tier);
  const isFreePlan = tier === 'free';

  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border/60 bg-card/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <IndustryTag industry={industry} />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
        <div className="min-w-0 text-sm leading-snug">
          <span className="font-display text-base text-foreground">
            {plan.name}
          </span>
          <span className="text-muted-foreground">
            {' '}
            · {plan.modelLabel} · {plan.includedMessages.toLocaleString()}{' '}
            messages/mo
          </span>
        </div>
        <Button
          asChild
          size="sm"
          variant={isFreePlan ? 'upgrade' : 'outline'}
          className="shrink-0"
        >
          <Link href={Routes.Billing}>
            {isFreePlan ? 'Upgrade plan' : 'Manage plan'}
          </Link>
        </Button>
      </div>
    </section>
  );
}
