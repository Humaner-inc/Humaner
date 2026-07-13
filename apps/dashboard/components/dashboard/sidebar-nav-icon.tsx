'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export function sidebarNavIconClassName(): string {
  return 'size-4 shrink-0 text-sidebar-foreground/50 transition-colors [&_svg]:text-current group-hover/nav:text-sidebar-foreground group-data-[active=true]/nav:text-sidebar-foreground';
}

export type SidebarNavIconProps = {
  children: React.ReactNode;
  className?: string;
};

export function SidebarNavIcon({
  children,
  className
}: SidebarNavIconProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'flex size-4 shrink-0 items-center justify-center',
        sidebarNavIconClassName(),
        className
      )}
    >
      {children}
    </span>
  );
}
