import * as React from 'react';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { isOssDeployment } from '@/lib/deployment-mode';

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
