'use client';

import * as React from 'react';
import Link from 'next/link';
import type { WorkspaceBillingAccessDto } from '@humaner/shared/billing-access';
import { BILLING_PAST_DUE_GRACE_DAYS } from '@humaner/shared/billing-access';
import { getPlanForTier } from '@humaner/shared/plans';

import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

const PLAN_NAME = getPlanForTier('classic').name;

function bannerCopy(
  access: WorkspaceBillingAccessDto
): { badge: string; message: string } | null {
  const banner = access.banner;
  if (!banner) {
    return null;
  }

  switch (banner.kind) {
    case 'payment_issue_grace': {
      const days = banner.graceDaysRemaining ?? 0;
      const dayLabel = days === 1 ? 'day' : 'days';
      return {
        badge: 'Payment issue',
        message: `We could not charge your ${PLAN_NAME} plan. Full access continues for ${days} more ${dayLabel} (${BILLING_PAST_DUE_GRACE_DAYS}-day grace), then this workspace becomes read-only.`
      };
    }
    case 'payment_issue_read_only':
      return {
        badge: 'Read-only',
        message: `Your ${PLAN_NAME} payment is overdue. This workspace is read-only until you update billing.`
      };
    case 'trial_ended':
      return {
        badge: 'Trial ended',
        message: `Your free trial has ended. This workspace is read-only until you start ${PLAN_NAME}.`
      };
    case 'subscription_ended':
      return {
        badge: 'Subscription ended',
        message: `Your ${PLAN_NAME} subscription is no longer active. This workspace is read-only until you resubscribe.`
      };
    default:
      return null;
  }
}

export function BillingAccessBanner({
  access,
  className
}: {
  access: WorkspaceBillingAccessDto;
  className?: string;
}): React.JSX.Element | null {
  const copy = bannerCopy(access);
  if (!copy) {
    return null;
  }

  return (
    <div
      className={cn(
        'border-b border-[#f85919]/25 bg-[#fce8dc] px-4 py-2.5 sm:px-5',
        className
      )}
      role="status"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 gap-y-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="shrink-0 rounded-full bg-[#5c4a32] px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-[#fce8dc]">
            {copy.badge}
          </span>
          <p className="min-w-0 text-sm leading-snug text-[#3d3428]">
            {copy.message}
          </p>
        </div>
        <Link
          href={Routes.Billing}
          className="shrink-0 font-mono text-xs font-medium text-[#c2410c] underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          Manage billing
        </Link>
      </div>
    </div>
  );
}
