import * as React from 'react';
import type { IndustryType } from '@prisma/client';
import { getPlanForTier, normalizePlanTier } from '@humaner/shared/plans';
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

/**
 * Subtle tier-tinted glow layered over the banner's neutral card background.
 * Classic (`free`) stays plain; paid tiers blend the same neutral grey into
 * a brand color — cobalt for Refined, the crimson accent for Frontier/Humaner.
 */
const TIER_BANNER_GLOW: Partial<Record<ReturnType<typeof normalizePlanTier>, string>> = {
  grow: 'bg-[linear-gradient(110deg,transparent_0%,transparent_35%,rgb(0_71_171_/_0.16)_100%)] dark:bg-[linear-gradient(110deg,transparent_0%,transparent_35%,rgb(0_71_171_/_0.28)_100%)]',
  scale:
    'bg-[linear-gradient(110deg,transparent_0%,transparent_35%,hsl(var(--primary)/0.14)_100%)] dark:bg-[linear-gradient(110deg,transparent_0%,transparent_35%,hsl(var(--primary)/0.24)_100%)]',
  delegate:
    'bg-[linear-gradient(110deg,transparent_0%,transparent_35%,hsl(var(--primary)/0.18)_100%)] dark:bg-[linear-gradient(110deg,transparent_0%,transparent_35%,hsl(var(--primary)/0.3)_100%)]'
};

export function DashboardOverviewStrip({
  industry,
  tier,
  className
}: DashboardOverviewStripProps): React.JSX.Element {
  const normalizedTier = normalizePlanTier(tier);
  const plan = getPlanForTier(tier);
  const isFreePlan = normalizedTier === 'free';
  const isManagePlanLink =
    normalizedTier === 'grow' || normalizedTier === 'scale';
  const tierGlow = TIER_BANNER_GLOW[normalizedTier];

  return (
    <section
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border/60 bg-card/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        className
      )}
    >
      {tierGlow ? (
        <div aria-hidden className={cn('pointer-events-none absolute inset-0', tierGlow)} />
      ) : null}

      <div className="relative flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <IndustryTag industry={industry} />
      </div>

      <div className="relative flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
        <div className="min-w-0 text-sm leading-snug">
          <span className="font-display text-base text-foreground">
            {plan.name}
          </span>
          <span className="font-mono tabular-nums text-muted-foreground">
            {' '}
            · {plan.modelLabel} · {plan.includedMessages.toLocaleString()}{' '}
            messages/mo
          </span>
        </div>
        {isManagePlanLink ? (
          <Link
            href={Routes.Billing}
            className="shrink-0 text-sm text-foreground underline underline-offset-4"
          >
            Manage plan
          </Link>
        ) : (
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
        )}
      </div>
    </section>
  );
}
