'use client';

import * as React from 'react';

import { useBranchIconAnimationContext } from '@/components/dashboard/sidebar-branch-icon';
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
  const context = useBranchIconAnimationContext();
  const child = React.Children.only(children);

  return (
    <span
      className={cn(
        'flex size-4 shrink-0 items-center justify-center',
        sidebarNavIconClassName(),
        className
      )}
    >
      {context && React.isValidElement(child)
        ? React.cloneElement(
            child as React.ReactElement<{ ref?: React.Ref<unknown> }>,
            { ref: context.iconRef }
          )
        : children}
    </span>
  );
}
