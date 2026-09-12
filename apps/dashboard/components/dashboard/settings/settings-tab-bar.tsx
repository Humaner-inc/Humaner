'use client';

import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from '@humaner/shared/icons';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type SettingsTabBarItem = {
  id: string;
  href: string;
  label: string;
  icon?: LucideIcon;
  active: boolean;
};

export function SettingsTabBar({
  ariaLabel,
  tabs,
  className
}: {
  ariaLabel: string;
  tabs: SettingsTabBarItem[];
  className?: string;
}): React.JSX.Element {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'mb-6 flex flex-wrap items-center gap-1 border-b border-border/60 pb-3',
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors',
              dashboardRadiusClassName,
              tab.active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
