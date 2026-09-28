import * as React from 'react';
import type { Metadata } from 'next';

import { Routes } from '@/constants/routes';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(Routes.AuditLogs);

export default function AuditLogsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return <>{children}</>;
}
