'use client';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export type SettingsTabBarItem = {
  id: string;
  href?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  active: boolean;
  onSelect?: () => void;
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
        'flex flex-wrap gap-x-5 border-b border-border/60',
        className
      )}
    >
      {tabs.map((tab) => {
        const classNameForTab = cn(
          '-mb-px border-b-2 pb-2.5 text-sm transition-colors',
          tab.active
            ? 'border-foreground font-medium text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        );

        if (tab.onSelect) {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.onSelect}
              className={classNameForTab}
            >
              {tab.label}
            </button>
          );
        }

        return (
          <Link
            key={tab.id}
            href={tab.href ?? '#'}
            className={classNameForTab}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
