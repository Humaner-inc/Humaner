'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatCreditUsd } from '@humaner/shared/credits';
import { PencilIcon } from '@humaner/shared/icons';

import { CompanionIcon } from '@/components/dashboard/ask-humaner/companion-icon';
import { useHumanerChatOptional } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

const USAGE_UPGRADE_THRESHOLD_PERCENT = 90;
const CREDITS_BAR_MS = 700;

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
      className="relative mt-2 h-px w-full min-w-0 overflow-hidden bg-foreground/15"
      role="progressbar"
      aria-label="Companion fuel"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-hidden={!expanded}
    >
      <div
        className="absolute inset-y-0 left-0 bg-foreground will-change-[width]"
        style={{ width: `${fillPercent}%` }}
      />
    </div>
  );
}

export type SidebarMessageUsageProps = {
  usage: SidebarMessageUsageDto;
  companionHref?: string | null;
  showCompanionUpgrade?: boolean;
  className?: string;
};

export function SidebarMessageUsage({
  usage,
  companionHref = null,
  showCompanionUpgrade = false,
  className
}: SidebarMessageUsageProps): React.JSX.Element {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const chat = useHumanerChatOptional();
  const companionLink = showCompanionUpgrade ? Routes.Billing : companionHref;
  const companionActive = Boolean(
    companionHref && !showCompanionUpgrade && pathname.startsWith(companionHref)
  );
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

  const fuelAmount = operatorOwned
    ? usage.messagesUsed.toLocaleString()
    : formatCreditUsd(meter.remainingCents);
  const fuelCaption = operatorOwned ? 'replies' : 'fuel remaining';

  return (
    <div
      className={cn(
        'min-w-0 px-2.5 pb-2.5 pt-1',
        !isMobile && 'group-data-[collapsible=icon]:px-1.5',
        className
      )}
      title={isIconRail && companionOn ? remainingLabel : undefined}
    >
      {chat ? (
        <CompanionStatus
          compact={isIconRail}
          href={companionLink}
          active={companionActive}
          upgrade={showCompanionUpgrade}
          fuelAmount={companionOn && !isIconRail ? fuelAmount : null}
          fuelCaption={fuelCaption}
        />
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
              className="mb-2 mt-2 h-8 w-full min-w-0"
            >
              <Link href={Routes.Billing}>
                {isFreePlan ? 'Start 7-day trial' : 'Add fuel'}
              </Link>
            </Button>
          ) : null}

          {isIconRail ? (
            <p className="pt-1.5 text-center font-mono text-[9px] font-medium tabular-nums leading-tight text-foreground/55">
              {operatorOwned
                ? usage.messagesUsed.toLocaleString()
                : formatCreditUsd(usage.creditsRemainingCents)}
            </p>
          ) : operatorOwned || chat ? null : (
            <p className="flex items-baseline gap-1 leading-none">
              <span className="font-mono text-[11px] tabular-nums text-foreground">
                {fuelAmount}
              </span>
              <span className="font-fellix text-[10px] text-foreground/45">
                {fuelCaption}
              </span>
            </p>
          )}
          {operatorOwned || isIconRail ? null : (
            <SidebarUsageProgress
              expanded
              value={usagePercent}
              fillPercent={meter.fillPercent}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CompanionStatus({
  compact = false,
  href,
  active = false,
  upgrade = false,
  fuelAmount,
  fuelCaption
}: {
  compact?: boolean;
  href: string | null;
  active?: boolean;
  upgrade?: boolean;
  fuelAmount: string | null;
  fuelCaption: string;
}): React.JSX.Element | null {
  const chat = useHumanerChatOptional();
  const [iconHot, setIconHot] = React.useState(false);
  if (!chat) return null;

  const visible = chat.companionVisible;
  const openLabel = 'Edit persona';

  return (
    <div
      className={cn(
        'flex min-w-0 items-center',
        compact ? 'justify-center' : 'gap-2.5'
      )}
    >
      <button
        type="button"
        aria-pressed={visible}
        aria-label={visible ? 'Turn Companion off' : 'Turn Companion on'}
        onClick={() => chat.setCompanionVisible(!visible)}
        onMouseEnter={() => setIconHot(true)}
        onMouseLeave={() => setIconHot(false)}
        onFocus={() => setIconHot(true)}
        onBlur={() => setIconHot(false)}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-[12px] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          visible
            ? 'bg-foreground/10 hover:bg-foreground/20'
            : 'bg-foreground/5 hover:bg-foreground/10'
        )}
      >
        <CompanionIcon
          active={visible}
          size={16}
          className={cn(
            'size-4 transition-opacity',
            visible ? 'opacity-100' : iconHot ? 'opacity-80' : 'opacity-40'
          )}
        />
      </button>
      {compact ? null : (
        <div className="min-w-0 flex-1">
          <div className="group/name flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                'truncate font-fellix text-[13px] leading-none tracking-tight text-foreground',
                active &&
                  'underline decoration-foreground/30 underline-offset-4'
              )}
            >
              Companion
            </span>
            {visible && href && !upgrade ? (
              <Link
                href={href}
                title={openLabel}
                aria-label={openLabel}
                className="inline-flex size-4 shrink-0 items-center justify-center text-foreground/50 opacity-0 transition-opacity group-hover/name:opacity-100 focus-visible:opacity-100 hover:text-foreground"
              >
                <PencilIcon className="size-3.5" />
              </Link>
            ) : null}
          </div>
          {fuelAmount ? (
            <p className="mt-1 flex items-baseline gap-1 leading-none">
              <span className="font-mono text-[11px] tabular-nums text-foreground/80">
                {fuelAmount}
              </span>
              <span className="font-fellix text-[10px] text-foreground/40">
                {fuelCaption}
              </span>
            </p>
          ) : (
            <p className="mt-1 font-fellix text-[10px] leading-none text-foreground/35">
              Off
            </p>
          )}
        </div>
      )}
    </div>
  );
}
