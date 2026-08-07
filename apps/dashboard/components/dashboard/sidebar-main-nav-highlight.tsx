'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/** Marks main-nav rows for optional tooling; active fill is on each row. */
export const SIDEBAR_MAIN_NAV_ATTR = 'data-sidebar-main-nav';

export type SidebarMainNavHighlightProps = {
  children: React.ReactNode;
  className?: string;
};

export function SidebarMainNavHighlight({
  children,
  className
}: SidebarMainNavHighlightProps): React.JSX.Element {
  return <div className={cn(className)}>{children}</div>;
}
