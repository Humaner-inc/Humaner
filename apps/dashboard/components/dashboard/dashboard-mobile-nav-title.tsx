'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ChevronsLeftRightIcon } from '@/components/ui/chevrons-left-right-icon';
import { useSidebar } from '@/components/ui/sidebar';
import { resolveDashboardPageTitle } from '@/lib/metadata/resolve-dashboard-page-title';

/** Mobile-only page name with the control that swaps the page for the nav. */
export function DashboardMobileNavTitle(): React.JSX.Element | null {
  const pathname = usePathname();
  const { isMobileFullPage, setOpen } = useSidebar();
  const title = resolveDashboardPageTitle(pathname ?? '');

  if (!isMobileFullPage) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-ml-2 size-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="Show navigation"
      >
        <ChevronsLeftRightIcon
          className="pointer-events-none shrink-0 text-current"
          size={16}
        />
      </Button>
      <span className="min-w-0 truncate font-display text-base font-normal tracking-tight">
        {title}
      </span>
    </div>
  );
}
