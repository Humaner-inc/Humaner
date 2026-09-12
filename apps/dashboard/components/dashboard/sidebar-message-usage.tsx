'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatCreditUsd } from '@humaner/shared/credits';

import { CompanionIcon } from '@/components/dashboard/ask-humaner/companion-icon';
import { useHumanerChatOptional } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Routes } from '@/constants/routes';
import { PLAN_TIER_ACCENT } from '@/lib/billing/plan-tier-accent';
import { cn } from '@/lib/utils';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

const USAGE_UPGRADE_THRESHOLD_PERCENT = 90;
const CREDITS_BAR_MS = 700;
const CREDITS_BAR_BLUE = PLAN_TIER_ACCENT.classic;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = (): void => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return reduced;
}

function useSyncedCreditsMeter(input: {
  play: boolean;
  remainingCents: number;
  usedCents: number;
  usagePercent: number;
}): { fillPercent: number; remainingCents: number } {
  const reducedMotion = usePrefersReducedMotion();
  const poolCents = input.remainingCents + input.usedCents;
  const hasPlayedRef = React.useRef(false);
  const [fillPercent, setFillPercent] = React.useState(0);
  const [remainingCents, setRemainingCents] = React.useState(poolCents);

  React.useEffect(() => {
    if (!input.play) {
      hasPlayedRef.current = false;
      setFillPercent(0);
      setRemainingCents(poolCents);
      return;
    }

    if (reducedMotion) {
      hasPlayedRef.current = true;
      setFillPercent(input.usagePercent);
      setRemainingCents(input.remainingCents);
      return;
    }

    const startFill = hasPlayedRef.current ? fillPercent : 0;
    const startRemaining = hasPlayedRef.current ? remainingCents : poolCents;
    const endFill = input.usagePercent;
    const endRemaining = input.remainingCents;
    hasPlayedRef.current = true;

    if (input.usedCents <= 0 && startFill === 0) {
      setFillPercent(0);
      setRemainingCents(input.remainingCents);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / CREDITS_BAR_MS);
      const eased = easeOutCubic(progress);
      setFillPercent(startFill + (endFill - startFill) * eased);
      setRemainingCents(
        Math.round(startRemaining + (endRemaining - startRemaining) * eased)
      );
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Intentionally omit displayed values so later ticks don't restart the tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last painted values
  }, [
    input.play,
    input.remainingCents,
    input.usagePercent,
    input.usedCents,
    poolCents,
    reducedMotion
  ]);

  return { fillPercent, remainingCents };
}

function SidebarUsageProgress({
  expanded,
  value,
  fillPercent
}: {
  expanded: boolean;
  value: number;
  fillPercent: number;
}): React.JSX.Element {
  return (
    <div
      className="relative h-1.5 w-full min-w-0 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-label="Companion fuel"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-hidden={!expanded}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full will-change-[width]"
        style={{
          width: `${fillPercent}%`,
          backgroundColor: CREDITS_BAR_BLUE
        }}
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
  const chat = useHumanerChatOptional();
  const isIconRail = !isMobile && state === 'collapsed';
  const usagePercent = Math.min(
    100,
    usage.creditsIncludedCents > 0
      ? Math.round((usage.creditsUsedCents / usage.creditsIncludedCents) * 100)
      : 0
  );
  const isFreePlan = usage.tier === 'free';
  const operatorOwned = Boolean(usage.operatorOwnedQuota);
  const companionOn = chat ? chat.companionVisible : true;
  const showUpgradeCta =
    companionOn &&
    !isIconRail &&
    !operatorOwned &&
    usagePercent >= USAGE_UPGRADE_THRESHOLD_PERCENT &&
    usage.tier !== 'humaner';
  const meter = useSyncedCreditsMeter({
    play: companionOn && !operatorOwned,
    remainingCents: usage.creditsRemainingCents,
    usedCents: usage.creditsUsedCents,
    usagePercent
  });
  const remainingLabel = `${formatCreditUsd(meter.remainingCents)} fuel remaining`;

  return (
    <div
      className={cn(
        'min-w-0 px-2',
        !isMobile && 'group-data-[collapsible=icon]:px-1',
        className
      )}
      title={isIconRail && companionOn ? remainingLabel : undefined}
    >
      {chat ? (
        <div className="flex justify-center py-1.5">
          <CompanionVisibilityToggle compact={isIconRail} />
        </div>
      ) : null}

      <div
        className={cn(
          'grid min-w-0 transition-[grid-template-rows,opacity] duration-300 ease-out',
          companionOn
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        )}
        aria-hidden={!companionOn}
      >
        <div className="min-w-0 overflow-hidden">
          {showUpgradeCta ? (
            <Button
              asChild
              size="sm"
              variant="upgrade"
              className="mb-1.5 h-8 w-full min-w-0"
            >
              <Link href={Routes.Billing}>
                {isFreePlan ? 'Upgrade plan' : 'Add fuel'}
              </Link>
            </Button>
          ) : null}

          {isIconRail ? (
            <p className="pb-1 text-center font-mono text-[9px] font-medium tabular-nums leading-tight text-muted-foreground">
              {operatorOwned
                ? usage.messagesUsed.toLocaleString()
                : formatCreditUsd(usage.creditsRemainingCents)}
            </p>
          ) : (
            <div className="space-y-1.5 pb-1.5">
              <p className="text-center font-mono text-[10px] font-medium tabular-nums">
                {operatorOwned
                  ? `${usage.messagesUsed.toLocaleString()} replies`
                  : remainingLabel}
              </p>
              {operatorOwned ? null : (
                <SidebarUsageProgress
                  expanded
                  value={usagePercent}
                  fillPercent={meter.fillPercent}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanionVisibilityToggle({
  compact = false
}: {
  compact?: boolean;
}): React.JSX.Element | null {
  const chat = useHumanerChatOptional();
  if (!chat) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center',
        compact ? 'gap-1' : 'gap-1.5'
      )}
    >
      <CompanionIcon
        active={chat.companionVisible}
        character={chat.companionCharacter}
        size={16}
        className="size-4"
      />
      <Switch
        checked={chat.companionVisible}
        onCheckedChange={chat.setCompanionVisible}
        aria-label={
          chat.companionVisible ? 'Turn Companion off' : 'Turn Companion on'
        }
        className={compact ? 'h-3.5 w-6' : undefined}
        thumbClassName={
          compact ? 'size-2.5 data-[state=checked]:translate-x-2.5' : undefined
        }
      />
    </span>
  );
}
