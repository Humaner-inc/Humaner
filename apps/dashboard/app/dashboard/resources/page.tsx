import * as React from 'react';
import type { Metadata } from 'next';

import { Routes } from '@/constants/routes';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

import { ResourcesPageBody } from './resources-page-body';

export const metadata: Metadata = createDashboardPageMetadata(Routes.Resources);

function ResourcesFallback(): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 px-6 py-5">
      <div className="h-8 w-48 animate-pulse bg-muted/40" />
      <div className="h-24 animate-pulse bg-muted/40" />
    </div>
  );
}

export default function ResourcesPage(): React.JSX.Element {
  return (
    <React.Suspense fallback={<ResourcesFallback />}>
      <ResourcesPageBody tab="sources" />
    </React.Suspense>
  );
}
