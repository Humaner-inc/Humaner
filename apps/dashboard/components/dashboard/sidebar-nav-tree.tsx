'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@humaner/shared/icons';
import type { LucideIcon } from '@humaner/shared/icons';

import { SIDEBAR_MAIN_NAV_ATTR } from '@/components/dashboard/sidebar-main-nav-highlight';
import { useSidebarNavDrawer } from '@/components/dashboard/sidebar-nav-accordion';
import { sidebarNavIconClassName } from '@/components/dashboard/sidebar-nav-icon';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function sidebarNavParentClassName(active: boolean): string {
  return cn(
    'group/nav flex w-full items-center gap-2.5 px-3 py-2 font-fellix text-sm transition-colors',
    active
      ? 'text-sidebar-foreground'
      : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'
  );
}

export function sidebarNavChildClassName(
  active: boolean,
  disabled?: boolean
): string {
  return cn(
    'flex w-full items-center gap-2 py-1.5 pl-4 pr-2 text-left font-fellix text-sm transition-colors',
    active
      ? 'text-sidebar-foreground'
      : 'text-sidebar-foreground/50 hover:text-sidebar-foreground',
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
  onNavigate?: () => void;
  tooltip?: string;
  mainNavHighlight?: boolean;
};

export function SidebarNavParent({
  icon: Icon,
  leading,
  label,
  active = false,
  expanded,
  onToggle,
  href,
  onNavigate,
  tooltip,
  mainNavHighlight = false
}: SidebarNavParentProps): React.JSX.Element {
  const isIconRail = useSidebarIconRail();
  const mainNavProps = mainNavHighlight
    ? ({ [SIDEBAR_MAIN_NAV_ATTR]: '' } as const)
    : {};

  const leadingNode =
    leading ?? (Icon ? <Icon className={sidebarNavIconClassName()} /> : null);

  if (isIconRail) {
    return (
      <Link
        href={href ?? '#'}
        title={tooltip ?? label}
        data-active={active ? true : undefined}
        {...mainNavProps}
        className={cn(
          sidebarNavParentClassName(active),
          'justify-center px-2 py-2.5',
          active && !mainNavHighlight && 'bg-muted/50'
        )}
      >
        {leadingNode}
      </Link>
    );
  }

  return (
    <div
      data-active={active ? true : undefined}
      {...mainNavProps}
      className={cn(
        sidebarNavParentClassName(active),
        'pr-1',
        active && !mainNavHighlight && 'bg-muted/40'
      )}
    >
      {href ? (
        <Link
          href={href}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-0 pl-0"
        >
          {leadingNode}
          <span className="flex-1 truncate">{label}</span>
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 py-0 pl-0">
          {leadingNode}
          <span className="flex-1 truncate">{label}</span>
        </div>
      )}
      <button
        type="button"
        aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
        onClick={onToggle}
        className="mr-1 flex size-7 shrink-0 items-center justify-center text-muted-foreground/60 transition-colors hover:text-foreground"
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

export type SidebarNavChildProps = {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
  tabIndex?: number;
};

export function SidebarNavChild({
  href,
  label,
  active = false,
  disabled = false,
  badge,
  tabIndex
}: SidebarNavChildProps): React.JSX.Element {
  return (
    <Link
      href={href}
      tabIndex={tabIndex}
      className={sidebarNavChildClassName(active, disabled)}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge}
    </Link>
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
};

export function SidebarNavTree({
  drawerId,
  icon,
  leading,
  label,
  active = false,
  parentHref,
  children,
  mainNavHighlight = false
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
        onNavigate={() => onOpenChange(true)}
        mainNavHighlight={mainNavHighlight}
      />
      <SidebarNavChildren expanded={open}>{children}</SidebarNavChildren>
    </div>
  );
}

export type SidebarNavLinkProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  external?: boolean;
  disabled?: boolean;
  mainNavHighlight?: boolean;
};

export function SidebarNavLink({
  href,
  icon: Icon,
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
        active && !mainNavHighlight && 'bg-muted/40',
        disabled && 'pointer-events-none opacity-40'
      )}
    >
      <Icon className={sidebarNavIconClassName()} />
      {!isIconRail ? <span className="flex-1 truncate">{label}</span> : null}
    </Link>
  );
}
