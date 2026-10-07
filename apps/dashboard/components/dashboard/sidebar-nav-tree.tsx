'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@humaner/shared/icons';
import type { LucideIcon } from '@humaner/shared/icons';

import {
  BranchIconAnimationProvider,
  useBranchIconAnimation
} from '@/components/dashboard/sidebar-branch-icon';
import { SIDEBAR_MAIN_NAV_ATTR } from '@/components/dashboard/sidebar-main-nav-highlight';
import { useSidebarNavDrawer } from '@/components/dashboard/sidebar-nav-accordion';
import { sidebarNavIconClassName } from '@/components/dashboard/sidebar-nav-icon';
import { Hint } from '@/components/ui/hint';
import { useSidebar } from '@/components/ui/sidebar';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

/** Collapsed rail: same square as the navbar buttons, filling the rail. */
const sidebarIconRailClassName =
  'mx-0 size-8 h-8 w-8 shrink-0 justify-center rounded-sm p-0';

export function sidebarNavParentClassName(active: boolean): string {
  return cn(
    'group/nav mx-0.5 flex h-8 w-[calc(100%-0.25rem)] items-center gap-2 rounded-sm px-2 font-fellix text-[13px] transition-colors',
    active
      ? 'bg-sidebar-item text-sidebar-foreground'
      : 'text-sidebar-foreground/65 hover:bg-sidebar-item/50 hover:text-sidebar-foreground'
  );
}

export function sidebarNavChildClassName(
  active: boolean,
  disabled?: boolean
): string {
  return cn(
    'group/nav mx-0.5 flex h-7 w-[calc(100%-0.25rem)] items-center gap-2 rounded-sm px-2 text-left font-fellix text-[13px] transition-colors',
    active
      ? 'bg-sidebar-item text-sidebar-foreground'
      : 'text-sidebar-foreground/60 hover:bg-sidebar-item/50 hover:text-sidebar-foreground',
    disabled && 'pointer-events-none opacity-40'
  );
}

function useSidebarIconRail(): boolean {
  const { state } = useSidebar();
  return state === 'collapsed';
}

export type SidebarNavParentProps = {
  icon?: LucideIcon;
  leading?: React.ReactNode;
  label: string;
  active?: boolean;
  expanded: boolean;
  onToggle: () => void;
  href?: string;
  tooltip?: string;
  mainNavHighlight?: boolean;
  badge?: React.ReactNode;
  quickAction?: {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
  };
};

export function SidebarNavParent({
  icon: Icon,
  leading,
  label,
  active = false,
  expanded,
  onToggle,
  href,
  tooltip,
  mainNavHighlight = false,
  badge,
  quickAction
}: SidebarNavParentProps): React.JSX.Element {
  const isIconRail = useSidebarIconRail();
  const { iconRef, rowHandlers } = useBranchIconAnimation();
  const mainNavProps = mainNavHighlight
    ? ({ [SIDEBAR_MAIN_NAV_ATTR]: '' } as const)
    : {};

  const leadingNode =
    leading ??
    (Icon ? (
      <Icon
        ref={iconRef}
        animateOnHover={false}
        className={sidebarNavIconClassName()}
      />
    ) : null);

  if (isIconRail) {
    return (
      <BranchIconAnimationProvider value={{ iconRef }}>
        <Hint
          label={tooltip ?? label}
          side="right"
        >
          <Link
            href={href ?? '#'}
            aria-label={tooltip ?? label}
            data-active={active ? true : undefined}
            data-icon-hover=""
            {...mainNavProps}
            {...rowHandlers}
            className={cn(
              sidebarNavParentClassName(active),
              sidebarIconRailClassName
            )}
          >
            {leadingNode}
          </Link>
        </Hint>
      </BranchIconAnimationProvider>
    );
  }

  return (
    <BranchIconAnimationProvider value={{ iconRef }}>
      <div
        data-active={active ? true : undefined}
        data-icon-hover=""
        {...mainNavProps}
        {...rowHandlers}
        className={cn(
          sidebarNavParentClassName(active),
          'pr-1',
          // Trees fill the active child row, not the branch.
          active && 'bg-transparent hover:bg-sidebar-item/50'
        )}
      >
        {href ? (
          <Link
            href={href}
            className="flex min-w-0 flex-1 items-center gap-2.5 py-0 pl-0 text-left"
          >
            {leadingNode}
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {badge ? <span className="mr-1 shrink-0">{badge}</span> : null}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center gap-2.5 py-0 pl-0 text-left"
          >
            {leadingNode}
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {badge ? <span className="mr-1 shrink-0">{badge}</span> : null}
          </button>
        )}
        {quickAction ? (
          <Hint label={quickAction.label}>
            <button
              type="button"
              aria-label={quickAction.label}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                quickAction.onClick?.();
              }}
              className={cn(
                'flex size-7 shrink-0 items-center justify-center text-sidebar-foreground/40 opacity-0 transition-opacity hover:bg-muted/40 hover:text-sidebar-foreground group-hover/nav:opacity-100 focus-visible:opacity-100',
                dashboardRadiusClassName
              )}
            >
              {quickAction.icon}
            </button>
          </Hint>
        ) : null}
        <button
          type="button"
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          onClick={onToggle}
          className={cn(
            'mr-0.5 flex size-7 shrink-0 items-center justify-center text-muted-foreground/60 transition-colors hover:bg-muted/40 hover:text-foreground',
            dashboardRadiusClassName
          )}
        >
          <ChevronRightIcon
            className={cn(
              'size-3.5 transition-transform duration-300 ease-out',
              expanded && 'rotate-90'
            )}
            strokeWidth={1.75}
          />
        </button>
      </div>
    </BranchIconAnimationProvider>
  );
}

export type SidebarNavChildrenProps = {
  expanded: boolean;
  children: React.ReactNode;
};

export function SidebarNavChildren({
  expanded,
  children
}: SidebarNavChildrenProps): React.JSX.Element {
  const isIconRail = useSidebarIconRail();

  if (isIconRail) {
    return (
      <div className="flex w-full flex-col items-center gap-0.5 py-0.5">
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}
    >
      <div className="overflow-hidden">
        <div className="ml-3 border-l border-border/40 py-0.5 pl-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Show one section banner instead of per-item Upgrade when more than this many pages are locked. */
export const SIDEBAR_UPGRADE_BANNER_MIN_LOCKED = 2;

export function shouldShowSidebarUpgradeBanner(lockedCount: number): boolean {
  // Self-Host has no Polar upgrades.
  if (process.env.NEXT_PUBLIC_DEPLOYMENT_MODE?.trim().toLowerCase() === 'oss') {
    return false;
  }
  return lockedCount > SIDEBAR_UPGRADE_BANNER_MIN_LOCKED;
}

/** Minimal accent banner between a section title and its locked children. */
export function SidebarNavUpgradeHeader({
  href
}: {
  href: string;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className="mb-1 mx-3 flex items-center justify-center bg-[#e0e1df] px-2 py-1 font-info text-[9px] uppercase tracking-[0.14em] text-[#0A0D0D] transition-colors hover:bg-[#cfd0ce] dark:text-[#f2f2f2]"
    >
      Upgrade
    </Link>
  );
}

export type SidebarNavChildProps = {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
  tabIndex?: number;
  leading?: React.ReactNode;
  /** Hover-revealed quick action (e.g. compose +). */
  quickAction?: {
    label: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
  };
};

export function SidebarNavChild({
  href,
  label,
  active = false,
  disabled = false,
  badge,
  tabIndex,
  leading,
  quickAction
}: SidebarNavChildProps): React.JSX.Element {
  const isIconRail = useSidebarIconRail();

  if (isIconRail) {
    return (
      <Hint
        label={label}
        side="right"
      >
        <Link
          href={disabled ? '#' : href}
          aria-label={label}
          tabIndex={tabIndex}
          className={cn(
            sidebarNavParentClassName(active),
            sidebarIconRailClassName,
            disabled && 'pointer-events-none opacity-40'
          )}
        >
          {leading}
        </Link>
      </Hint>
    );
  }

  return (
    <div
      className={cn(
        'group/child relative flex w-full items-center',
        disabled && 'pointer-events-none opacity-40'
      )}
    >
      <Link
        href={disabled ? '#' : href}
        tabIndex={tabIndex}
        aria-disabled={disabled || undefined}
        className={cn(
          sidebarNavChildClassName(active, false),
          quickAction && 'pr-8'
        )}
      >
        {leading}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badge}
      </Link>
      {quickAction && !disabled ? (
        quickAction.onClick ? (
          <Hint label={quickAction.label}>
            <button
              type="button"
              aria-label={quickAction.label}
              tabIndex={tabIndex}
              className={cn(
                'absolute right-1 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center text-sidebar-foreground/40 opacity-0 transition-opacity hover:text-sidebar-foreground group-hover/child:opacity-100 focus-visible:opacity-100',
                dashboardRadiusClassName
              )}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                quickAction.onClick?.();
              }}
            >
              {quickAction.icon}
            </button>
          </Hint>
        ) : quickAction.href ? (
          <Hint label={quickAction.label}>
            <Link
              href={quickAction.href}
              aria-label={quickAction.label}
              tabIndex={tabIndex}
              className={cn(
                'absolute right-1 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center text-sidebar-foreground/40 opacity-0 transition-opacity hover:text-sidebar-foreground group-hover/child:opacity-100 focus-visible:opacity-100',
                dashboardRadiusClassName
              )}
              onClick={(event) => event.stopPropagation()}
            >
              {quickAction.icon}
            </Link>
          </Hint>
        ) : null
      ) : null}
    </div>
  );
}

export type SidebarNavSectionProps = {
  label: string;
  children: React.ReactNode;
  railHref?: string;
  leading?: React.ReactNode;
  railActive?: boolean;
};

/** Always-visible section label with sub-pages. Not a navigable parent. */
export function SidebarNavSection({
  label,
  children,
  railHref,
  leading,
  railActive = false
}: SidebarNavSectionProps): React.JSX.Element {
  const isIconRail = useSidebarIconRail();

  if (isIconRail) {
    if (!railHref) {
      return <></>;
    }
    return (
      <SidebarNavLink
        href={railHref}
        label={label}
        active={railActive}
        leading={leading}
        mainNavHighlight
      />
    );
  }

  return (
    <div>
      <p className="px-3 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-sidebar-foreground/35">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export type SidebarNavTreeProps = {
  drawerId: string;
  icon?: LucideIcon;
  leading?: React.ReactNode;
  label: string;
  active?: boolean;
  parentHref?: string;
  children: React.ReactNode;
  mainNavHighlight?: boolean;
  badge?: React.ReactNode;
  quickAction?: SidebarNavParentProps['quickAction'];
};

export function SidebarNavTree({
  drawerId,
  icon,
  leading,
  label,
  active = false,
  parentHref,
  children,
  mainNavHighlight = false,
  badge,
  quickAction
}: SidebarNavTreeProps): React.JSX.Element {
  const { open, onOpenChange } = useSidebarNavDrawer(drawerId);

  return (
    <div>
      <SidebarNavParent
        icon={icon}
        leading={leading}
        label={label}
        active={active}
        expanded={open}
        onToggle={() => onOpenChange(!open)}
        href={parentHref}
        mainNavHighlight={mainNavHighlight}
        badge={badge}
        quickAction={quickAction}
      />
      <SidebarNavChildren expanded={open}>{children}</SidebarNavChildren>
    </div>
  );
}

export type SidebarNavLinkProps = {
  href: string;
  icon?: LucideIcon;
  leading?: React.ReactNode;
  label: string;
  active?: boolean;
  external?: boolean;
  disabled?: boolean;
  mainNavHighlight?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
};

export function SidebarNavLink({
  href,
  icon: Icon,
  leading,
  label,
  active = false,
  external = false,
  disabled = false,
  mainNavHighlight = false,
  badge,
  onClick
}: SidebarNavLinkProps): React.JSX.Element {
  const isIconRail = useSidebarIconRail();
  const mainNavProps = mainNavHighlight
    ? ({ [SIDEBAR_MAIN_NAV_ATTR]: '' } as const)
    : {};
  const className = cn(
    sidebarNavParentClassName(active),
    isIconRail && sidebarIconRailClassName,
    disabled && 'pointer-events-none opacity-40'
  );

  if (onClick) {
    return (
      <Hint
        label={label}
        side="right"
        disabled={!isIconRail}
      >
        <button
          type="button"
          aria-label={isIconRail ? label : undefined}
          data-active={active ? true : undefined}
          {...mainNavProps}
          disabled={disabled}
          className={className}
          onClick={onClick}
        >
          {leading ??
            (Icon ? <Icon className={sidebarNavIconClassName()} /> : null)}
          {!isIconRail ? (
            <span className="flex-1 truncate text-left">{label}</span>
          ) : null}
          {!isIconRail ? badge : null}
        </button>
      </Hint>
    );
  }

  return (
    <Hint
      label={label}
      side="right"
      disabled={!isIconRail}
    >
      <Link
        href={disabled ? '#' : href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        aria-label={isIconRail ? label : undefined}
        data-active={active ? true : undefined}
        {...mainNavProps}
        className={className}
      >
        {leading ??
          (Icon ? <Icon className={sidebarNavIconClassName()} /> : null)}
        {!isIconRail ? <span className="flex-1 truncate">{label}</span> : null}
        {!isIconRail ? badge : null}
      </Link>
    </Hint>
  );
}
