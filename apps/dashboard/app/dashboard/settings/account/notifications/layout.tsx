import * as React from 'react';
import type { Metadata } from 'next';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.Notifications
);

export type NotificationsLayoutProps = {
  transactionalEmails: React.ReactNode;
  activityNotifications: React.ReactNode;
  marketingEmails: React.ReactNode;
};

export default function NotificationsLayout({
  transactionalEmails,
  activityNotifications,
  marketingEmails
}: NotificationsLayoutProps): React.JSX.Element {
  const oss = isOssDeployment();

  return (
    <AnnotatedLayout className="py-0">
      {transactionalEmails}
      <Separator />
      {activityNotifications}
      {!oss ? (
        <>
          <Separator />
          {marketingEmails}
        </>
      ) : null}
    </AnnotatedLayout>
  );
}
