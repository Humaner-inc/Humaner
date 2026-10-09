'use client';

import * as React from 'react';
import Link from 'next/link';

import { useDashboardSection } from '@/components/dashboard/dashboard-section-context';
import { DASHBOARD_SECTION_ICONS } from '@/components/dashboard/dashboard-section-icons';
import { cn } from '@/lib/utils';

/**
 * Same size and radius in every state, so hover never reflows the type.
 * Height and radius match the size-8 / rounded-sm icon buttons on the right of
 * the top nav; min-w-8 keeps icon-only tabs the same footprint as those.
 */
const tabShapeClassName =
  'h-8 min-w-8 justify-center gap-0 rounded-sm px-2 py-0 font-display text-xs font-semibold leading-none tracking-tight';

const tabMotionClassName =
  'transition-[background-color,color,box-shadow] duration-[var(--resize-dur)] ease-[var(--resize-ease)] motion-reduce:transition-none';

const activeTabClassName = cn(
  tabShapeClassName,
  tabMotionClassName,
  'bg-[#0A0D0D]/85 text-[#f2f2f2] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]',
  'dark:bg-[#f2f2f2]/85 dark:text-[#0A0D0D] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)]'
);

const idleTabClassName = cn(
  tabShapeClassName,
  tabMotionClassName,
  'bg-transparent text-sidebar-foreground/55 hover:bg-background hover:text-sidebar-foreground'
);

export type DashboardSectionTabsProps = {
  className?: string;
};

export function DashboardSectionTabs({
  className
}: DashboardSectionTabsProps): React.JSX.Element | null {
  const { sections, activeSection, pathInSection } = useDashboardSection();
  const [pendingSection, setPendingSection] = React.useState<string | null>(
    null
  );
  const focusedId = pendingSection ?? activeSection;

  React.useEffect(() => {
    setPendingSection(null);
  }, [activeSection]);

  if (sections.length === 0) {
    return null;
  }

  const tab = (section: (typeof sections)[number]): React.JSX.Element => {
    const selected = section.id === focusedId;
    const current = section.id === activeSection && pathInSection;
    const Icon = DASHBOARD_SECTION_ICONS[section.id];
    const showLabel = selected;

    return (
      <Link
        key={section.id}
        href={section.href}
        data-section-tab={section.id}
        onClick={() => setPendingSection(section.id)}
        aria-current={current ? 'page' : undefined}
        aria-label={section.label}
        className={cn(
          'group/tab pointer-events-auto flex min-w-0 items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          selected ? activeTabClassName : idleTabClassName
        )}
      >
        <Icon
          size={16}
          weight={selected ? 'fill' : 'regular'}
          className="size-4 shrink-0"
        />
        <span
          className={cn(
            'grid transition-[grid-template-columns,opacity] duration-[var(--resize-dur)] ease-[var(--resize-ease)] motion-reduce:transition-none',
            showLabel
              ? 'grid-cols-[1fr] opacity-100'
              : 'grid-cols-[0fr] opacity-0 group-hover/tab:grid-cols-[1fr] group-hover/tab:opacity-100 group-focus-visible/tab:grid-cols-[1fr] group-focus-visible/tab:opacity-100'
          )}
        >
          <span className="overflow-hidden">
            <span className="block whitespace-nowrap pl-1.5">
              {section.label}
            </span>
          </span>
        </span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Sections"
      className={cn(
        'pointer-events-none flex h-8 w-full min-w-0 items-center justify-center',
        className
      )}
    >
      <div className="flex items-center gap-1">{sections.map(tab)}</div>
    </nav>
  );
}
