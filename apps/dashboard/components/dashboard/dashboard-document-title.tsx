'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { resolveDashboardPageTitle } from '@/lib/metadata/resolve-dashboard-page-title';
import { createTitle } from '@/lib/utils';

/** Keeps the browser tab title aligned with the active dashboard route. */
export function DashboardDocumentTitle(): null {
  const pathname = usePathname();

  React.useEffect(() => {
    document.title = createTitle(resolveDashboardPageTitle(pathname ?? ''));
  }, [pathname]);

  return null;
}
