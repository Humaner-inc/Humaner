'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

const USAGE_UPGRADE_THRESHOLD_PERCENT = 90;
const SIDEBAR_TRANSITION_CLASS = 'duration-200 ease-linear';

function SidebarUsageProgress({
  expanded,
  value
}: {
  expanded: boolean;
  value: number;
}): React.JSX.Element {
  const [fillPercent, setFillPercent] = React.useState(expanded ? value : 0);

  React.useEffect(() => {
    if (!expanded) {
      setFillPercent(0);
      return;
    }

    const frame = requestAnimationFrame(() => setFillPercent(value));
    return () => cancelAnimationFrame(frame);
  }, [expanded, value]);

  return (
    <div
      className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-hidden={!expanded}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full bg-primary will-change-[width]',
          `transition-[width] ${SIDEBAR_TRANSITION_CLASS}`
        )}
        style={{ width: `${fillPercent}%` }}
      />
    </div>
  );
}

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

  const usageLabel = `${usage.messagesUsed.toLocaleString()} / ${usage.includedMessages.toLocaleString()}`;

  return (
    <div
      className={cn('px-2 pb-2', className)}
      title={isCollapsed ? `Messages this month: ${usageLabel}` : undefined}
    >
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity]',
          SIDEBAR_TRANSITION_CLASS,
          showUpgradeCta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
        aria-hidden={!showUpgradeCta}
      >
        <div className="overflow-hidden">
          <Button
            asChild
            size="sm"
            variant="upgrade"
            className="mb-2 h-8 w-full"
          >
            <Link href={Routes.Billing}>
              {isFreePlan ? 'Upgrade plan' : 'Upgrade for more messages'}
            </Link>
          </Button>
        </div>
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity]',
          SIDEBAR_TRANSITION_CLASS,
          isCollapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
        aria-hidden={!isCollapsed}
      >
        <div className="overflow-hidden">
          <div className="flex justify-center px-0.5">
            <span className="text-center font-mono text-[9px] font-medium leading-tight tabular-nums text-muted-foreground">
              {usage.messagesUsed.toLocaleString()}
              <span className="text-muted-foreground/70">
                /{usage.includedMessages.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'space-y-2 overflow-hidden',
          `transition-[max-height,opacity] ${SIDEBAR_TRANSITION_CLASS}`,
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'
        )}
        aria-hidden={isCollapsed}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-2 text-xs',
            `transition-opacity ${SIDEBAR_TRANSITION_CLASS}`,
            isCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          <span className="text-muted-foreground">Messages this month</span>
          <span className="shrink-0 font-mono text-[10px] font-medium tabular-nums">
            {usageLabel}
          </span>
        </div>
        <SidebarUsageProgress
          expanded={!isCollapsed}
          value={usagePercent}
        />
      </div>
    </div>
  );
}
