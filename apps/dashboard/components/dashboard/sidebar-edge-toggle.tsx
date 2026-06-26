'use client';

import * as React from 'react';

import { ChevronsLeftRightIcon } from '@/components/ui/chevrons-left-right-icon';
import { ChevronsRightLeftIcon } from '@/components/ui/chevrons-right-left-icon';
import { useSidebar } from '@/components/ui/sidebar';
import { MediaQueries } from '@/constants/media-queries';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

export function SidebarEdgeToggle(): React.JSX.Element | null {
  const sidebar = useSidebar();
  const xlUp = useMediaQuery(MediaQueries.XlUp, { ssr: true, fallback: true });
  const isCollapsed = !sidebar.isMobile && !sidebar.open;

  if (!xlUp || sidebar.isMobile) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Toggle sidebar"
      onClick={() => sidebar.toggleSidebar()}
      className={cn(
        'fixed top-7 z-40 hidden -translate-x-1/2 -translate-y-1/2 p-0',
        'bg-transparent text-muted-foreground transition-[left,color] duration-200 ease-linear',
        'hover:bg-transparent hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'xl:flex'
      )}
      style={{
        left: isCollapsed
          ? 'var(--sidebar-width-icon)'
          : 'var(--sidebar-width)'
      }}
    >
      {isCollapsed ? (
        <ChevronsLeftRightIcon
          className="shrink-0 text-current"
          size={16}
        />
      ) : (
        <ChevronsRightLeftIcon
          className="shrink-0 text-current"
          size={16}
        />
      )}
    </button>
  );
}
