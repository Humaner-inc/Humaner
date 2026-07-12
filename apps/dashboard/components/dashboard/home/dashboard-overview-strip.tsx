import * as React from 'react';
import Link from 'next/link';
import {
  getPlanForTier,
  normalizePlanTier,
  type PlanTier
} from '@humaner/shared/plans';
import type { IndustryType, TargetAudience } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { getIndustry } from '@/lib/industries';
import { getLogoUrl, toHostname } from '@/lib/logo';
import { cn } from '@/lib/utils';

export type DashboardOverviewStripProps = {
  organizationName: string;
  website?: string | null;
  logoUrl?: string | null;
  industry: IndustryType | null;
  targetAudience: TargetAudience | null;
  tier: string;
  className?: string;
};

/** Tier accent — matches pricing model dots (cobalt / cream). */
const TIER_ACCENT: Record<PlanTier, string> = {
  free: '#a8a4a0',
  grow: '#0047ab',
  scale: '#c9ae84',
  delegate: '#e1ccaf'
};

function OverviewOrgMeta({
  organizationName,
  website,
  logoUrl,
  industry,
  targetAudience
}: Pick<
  DashboardOverviewStripProps,
  'organizationName' | 'website' | 'logoUrl' | 'industry' | 'targetAudience'
>): React.JSX.Element {
  const domain = website ? toHostname(website) : null;
  const logoSrc = logoUrl ?? (domain ? getLogoUrl(domain, 40, true) : null);
  const industryLabel = industry ? getIndustry(industry).label : null;
  const audienceLabel =
    targetAudience === 'B2B' ? 'B2B' : targetAudience === 'B2C' ? 'B2C' : null;
  const context = [industryLabel, audienceLabel].filter(Boolean).join(' · ');

  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          className="size-5 shrink-0 rounded object-cover"
        />
      ) : null}
      <span className="truncate">{organizationName}</span>
      {context ? (
        <>
          <span
            aria-hidden
            className="text-border"
          >
            ·
          </span>
          <span className="truncate">{context}</span>
        </>
      ) : null}
    </div>
  );
}

export function DashboardOverviewStrip({
  organizationName,
  website,
  logoUrl,
  industry,
  targetAudience,
  tier,
  className
}: DashboardOverviewStripProps): React.JSX.Element {
  const normalizedTier = normalizePlanTier(tier);
  const plan = getPlanForTier(tier);
  const isFreePlan = normalizedTier === 'free';
  const tierAccent = TIER_ACCENT[normalizedTier];

  return (
    <section
      className={cn(
        'flex flex-col gap-6 border-b border-border/50 pb-8 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-3">
        <h1 className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
          {plan.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          <span style={{ color: tierAccent }}>{plan.modelLabel}</span>
          <span
            aria-hidden
            className="mx-2 text-border"
          >
            ·
          </span>
          <span className="font-mono tabular-nums">
            {plan.includedMessages.toLocaleString()} messages/mo
          </span>
        </p>
        <OverviewOrgMeta
          organizationName={organizationName}
          website={website}
          logoUrl={logoUrl}
          industry={industry}
          targetAudience={targetAudience}
        />
      </div>

      <div className="shrink-0">
        {isFreePlan ? (
          <Button
            asChild
            size="sm"
            variant="upgrade"
          >
            <Link href={Routes.Billing}>Upgrade plan</Link>
          </Button>
        ) : (
          <Link
            href={Routes.Billing}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Manage billing
          </Link>
        )}
      </div>
    </section>
  );
}
