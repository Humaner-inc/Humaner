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
import { useSidebar } from '@/components/ui/sidebar';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export function sidebarNavParentClassName(active: boolean): string {
  return cn(
    'group/nav flex w-full items-center gap-2.5 px-3 py-2 font-fellix text-sm transition-colors',
    dashboardRadiusClassName,
    active
      ? 'text-sidebar-foreground'
      : 'text-sidebar-foreground/50 hover:bg-muted/30 hover:text-sidebar-foreground'
  );
}

export function sidebarNavChildClassName(
  active: boolean,
  disabled?: boolean
): string {
  return cn(
    'flex w-full items-center gap-2 py-1.5 pl-4 pr-2 text-left font-fellix text-sm font-light transition-colors',
    dashboardRadiusClassName,
    active
      ? 'text-sidebar-foreground'
      : 'text-sidebar-foreground/50 hover:bg-muted/20 hover:text-sidebar-foreground',
    disabled && 'pointer-events-none opacity-40'
  );
}

function useSidebarIconRail(): boolean {
  const { state, isMobile } = useSidebar();
  return state === 'collapsed' && !isMobile;
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
  badge
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
        <Link
          href={href ?? '#'}
          title={tooltip ?? label}
          data-active={active ? true : undefined}
          data-icon-hover=""
          {...mainNavProps}
          {...rowHandlers}
          className={cn(
            sidebarNavParentClassName(active),
            'justify-center px-2 py-2.5',
            active && 'bg-muted/50'
          )}
        >
          {leadingNode}
        </Link>
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
          active && 'bg-muted/40'
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-0 pl-0 text-left"
        >
          {leadingNode}
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {badge ? <span className="mr-1 shrink-0">{badge}</span> : null}
        </button>
        <button
          type="button"
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          onClick={onToggle}
          className={cn(
            'mr-1 flex size-7 shrink-0 items-center justify-center text-muted-foreground/60 transition-colors hover:bg-muted/40 hover:text-foreground',
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
    return <></>;
  }

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}
    >
      <div className="overflow-hidden">
        <div className="ml-[1.125rem] border-l border-border/50 py-0.5">
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
      className="mb-1 mx-3 flex items-center justify-center bg-[#e1ccaf] px-2 py-1 font-info text-[9px] uppercase tracking-[0.14em] text-[#0A0D0D] transition-colors hover:bg-[#ebe0cd]"
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
  quickAction
}: SidebarNavChildProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'group/child relative flex w-full items-center',
        disabled && 'pointer-events-none opacity-40'
      )}
    >
      <Link
        href={href}
        tabIndex={tabIndex}
        className={cn(
          sidebarNavChildClassName(active, false),
          quickAction && 'pr-8'
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badge}
      </Link>
      {quickAction && !disabled ? (
        quickAction.onClick ? (
          <button
            type="button"
            aria-label={quickAction.label}
            title={quickAction.label}
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
        ) : quickAction.href ? (
          <Link
            href={quickAction.href}
            aria-label={quickAction.label}
            title={quickAction.label}
            tabIndex={tabIndex}
            className={cn(
              'absolute right-1 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center text-sidebar-foreground/40 opacity-0 transition-opacity hover:text-sidebar-foreground group-hover/child:opacity-100 focus-visible:opacity-100',
              dashboardRadiusClassName
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {quickAction.icon}
          </Link>
        ) : null
      ) : null}
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
  badge
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
};

export function SidebarNavLink({
  href,
  icon: Icon,
  leading,
  label,
  active = false,
  external = false,
  disabled = false,
  mainNavHighlight = false
}: SidebarNavLinkProps): React.JSX.Element {
  const isIconRail = useSidebarIconRail();
  const mainNavProps = mainNavHighlight
    ? ({ [SIDEBAR_MAIN_NAV_ATTR]: '' } as const)
    : {};

  return (
    <Link
      href={disabled ? '#' : href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      title={isIconRail ? label : undefined}
      data-active={active ? true : undefined}
      {...mainNavProps}
      className={cn(
        sidebarNavParentClassName(active),
        isIconRail && 'justify-center px-2 py-2.5',
        active && 'bg-muted/40',
        disabled && 'pointer-events-none opacity-40'
      )}
    >
      {leading ??
        (Icon ? <Icon className={sidebarNavIconClassName()} /> : null)}
      {!isIconRail ? <span className="flex-1 truncate">{label}</span> : null}
    </Link>
  );
}
