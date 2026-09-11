import * as React from 'react';
import Link from 'next/link';
import { formatCreditUsd } from '@humaner/shared/credits';
import {
  formatPlanIncludedMessages,
  getEffectivePlan,
  isOperatorOwnedQuotaPlan,
  normalizePlanTier,
  OPERATOR_OWNED_QUOTA_LABEL
} from '@humaner/shared/plans';
import type { IndustryType, TargetAudience } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { HintLabel } from '@/components/ui/hint-label';
import { Routes } from '@/constants/routes';
import { PLAN_TIER_ACCENT } from '@/lib/billing/plan-tier-accent';
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
  includedMessages?: number;
  creditsUsedCents?: number;
  creditsRemainingCents?: number;
  /** Owners / platform admins only — teammates must not see Billing CTAs. */
  canAccessBilling?: boolean;
  /** Self-Host kit — no Polar plan / Upgrade CTA. */
  selfHostMode?: boolean;
  className?: string;
};

export function DashboardOverviewStrip({
  organizationName,
  website,
  logoUrl,
  industry,
  targetAudience,
  tier,
  includedMessages,
  creditsUsedCents,
  creditsRemainingCents,
  canAccessBilling = false,
  selfHostMode = false,
  className
}: DashboardOverviewStripProps): React.JSX.Element {
  const normalizedTier = normalizePlanTier(tier);
  const plan = getEffectivePlan(tier, includedMessages);
  const isFreePlan = normalizedTier === 'free';
  const tierAccent = PLAN_TIER_ACCENT[normalizedTier];
  const domain = website ? toHostname(website) : null;
  const logoSrc = logoUrl ?? (domain ? getLogoUrl(domain, 40, true) : null);
  const industryLabel = industry ? getIndustry(industry).label : null;
  const audienceLabel =
    targetAudience === 'B2B' ? 'B2B' : targetAudience === 'B2C' ? 'B2C' : null;
  const audienceFontClass =
    targetAudience === 'B2B'
      ? 'font-fellix'
      : targetAudience === 'B2C'
        ? 'font-display'
        : null;

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
            className={cn(
              'mt-0.5 size-8 shrink-0 rounded-none border border-border/60 object-cover'
            )}
          />
        ) : null}
        <div className="min-w-0 space-y-1.5">
          <h1 className="page-title truncate">{organizationName}</h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs leading-none text-muted-foreground">
            {selfHostMode ? (
              <span className="leading-none text-foreground">Self-hosted</span>
            ) : (
              <>
                <HintLabel
                  hint={`${plan.name} plan · ${plan.tagline}`}
                  className="leading-none font-medium"
                >
                  <span style={{ color: tierAccent }}>{plan.name}</span>
                </HintLabel>
                {isOperatorOwnedQuotaPlan(plan) &&
                formatPlanIncludedMessages(plan) ===
                  OPERATOR_OWNED_QUOTA_LABEL ? null : (
                  <>
                    <span
                      aria-hidden
                      className="inline-flex size-[1em] items-center justify-center leading-none text-border"
                    >
                      ·
                    </span>
                    <span className="tabular-nums leading-none">
                      {creditsRemainingCents != null
                        ? `${formatCreditUsd(creditsRemainingCents)} remaining`
                        : 'Credits'}
                    </span>
                  </>
                )}
              </>
            )}
            {industryLabel ? (
              <>
                <span
                  aria-hidden
                  className="inline-flex size-[1em] items-center justify-center leading-none text-border"
                >
                  ·
                </span>
                <span className="leading-none">{industryLabel}</span>
              </>
            ) : null}
            {selfHostMode && audienceLabel && audienceFontClass ? (
              <>
                <span
                  aria-hidden
                  className="inline-flex size-[1em] items-center justify-center leading-none text-border"
                >
                  ·
                </span>
                <span
                  className={cn(
                    'leading-none font-semibold tracking-tight',
                    audienceFontClass
                  )}
                >
                  {audienceLabel}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {canAccessBilling && !selfHostMode ? (
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
      ) : null}
    </section>
  );
}
