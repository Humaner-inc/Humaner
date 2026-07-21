import * as React from 'react';
import Link from 'next/link';
import {
  getPlanForTier,
  normalizePlanTier,
  type PlanTier
} from '@humaner/shared/plans';
import type { IndustryType, TargetAudience } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { HintLabel } from '@/components/ui/hint-label';
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

const TIER_ACCENT: Record<PlanTier, string> = {
  free: '#a8a4a0',
  classic: '#6b8cae',
  grow: '#0047ab',
  scale: '#c9ae84',
  delegate: '#e1ccaf'
};

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
  const domain = website ? toHostname(website) : null;
  const logoSrc = logoUrl ?? (domain ? getLogoUrl(domain, 40, true) : null);
  const industryLabel = industry ? getIndustry(industry).label : null;
  const audienceLabel =
    targetAudience === 'B2B' ? 'B2B' : targetAudience === 'B2C' ? 'B2C' : null;
  const context = [industryLabel, audienceLabel].filter(Boolean).join(' · ');

  return (
    <section
      className={cn(
        'flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt=""
            className="mt-0.5 size-8 shrink-0 border border-border/60 object-cover"
          />
        ) : null}
        <div className="min-w-0 space-y-1.5">
          <h1 className="truncate font-mono text-2xl font-medium tracking-tight">
            {organizationName}
          </h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <HintLabel
              hint={`${plan.name} plan · ${plan.humanerModel.tagline}`}
              className="font-medium"
            >
              <span style={{ color: tierAccent }}>{plan.name}</span>
            </HintLabel>
            <span
              aria-hidden
              className="text-border"
            >
              ·
            </span>
            <span className="font-mono text-xs tabular-nums">
              {plan.includedMessages.toLocaleString()} msg/mo
            </span>
            {context ? (
              <>
                <span
                  aria-hidden
                  className="text-border"
                >
                  ·
                </span>
                <span className="text-xs">{context}</span>
              </>
            ) : null}
          </p>
        </div>
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
            Billing
          </Link>
        )}
      </div>
    </section>
  );
}
