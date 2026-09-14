'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPlanCapabilities } from '@humaner/shared/plans';

import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import {
  LOCKED_FEATURE_COPY,
  resolveLockedWorkspaceFeature
} from '@/lib/billing/plan-feature-lock';

export function PlanFeatureLock({
  orgTier,
  children
}: {
  orgTier: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const feature = resolveLockedWorkspaceFeature(
    pathname,
    getPlanCapabilities(orgTier)
  );

  if (!feature) {
    return <>{children}</>;
  }

  const copy = LOCKED_FEATURE_COPY[feature];

  return (
    <div className="relative h-full min-h-0 flex-1 overflow-hidden">
      <div className="pointer-events-none h-full min-h-0 select-none opacity-55">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0d0d]/35 px-6 backdrop-blur-[2px]">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-white/10 bg-[#0a0d0d]/90 px-6 py-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <p className="font-display text-lg font-semibold tracking-tight text-[#F2F2F2]">
            {copy.title}
          </p>
          <p className="text-sm text-white/55">{copy.body}</p>
          <Button
            asChild
            className="mt-1 rounded-full"
          >
            <Link href={Routes.Billing}>Upgrade to Inbox</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
