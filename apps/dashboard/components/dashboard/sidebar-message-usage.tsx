'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSidebar } from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

const USAGE_UPGRADE_THRESHOLD_PERCENT = 90;

export type SidebarMessageUsageProps = {
  usage: SidebarMessageUsageDto;
  className?: string;
};

export function SidebarMessageUsage({
  usage,
  className
}: SidebarMessageUsageProps): React.JSX.Element {
  const { state, isMobile } = useSidebar();
  const isCollapsed = !isMobile && state === 'collapsed';
  const usagePercent = Math.min(
    100,
    usage.includedMessages > 0
      ? Math.round((usage.messagesUsed / usage.includedMessages) * 100)
      : 0
  );
  const isFreePlan = usage.tier === 'free';
  const showUpgradeCta =
    !isCollapsed &&
    usagePercent >= USAGE_UPGRADE_THRESHOLD_PERCENT &&
    usage.tier !== 'delegate';

  return (
    <div
      className={cn('space-y-2 px-2 pb-2', className)}
      title={
        isCollapsed
          ? `Messages this month: ${usage.messagesUsed.toLocaleString()} / ${usage.includedMessages.toLocaleString()}`
          : undefined
      }
    >
      {showUpgradeCta ? (
        <Button
          asChild
          size="sm"
          variant="upgrade"
          className="h-8 w-full"
        >
          <Link href={Routes.Billing}>
            {isFreePlan ? 'Upgrade plan' : 'Upgrade for more messages'}
          </Link>
        </Button>
      ) : null}
      {!isCollapsed ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Messages this month</span>
          <span className="shrink-0 font-medium tabular-nums">
            {usage.messagesUsed.toLocaleString()} /{' '}
            {usage.includedMessages.toLocaleString()}
          </span>
        </div>
      ) : null}
      <Progress
        value={usagePercent}
        className={cn('h-1.5', isCollapsed && 'mx-auto w-6')}
      />
    </div>
  );
}
