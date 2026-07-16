import * as React from 'react';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';

export type NotificationsLayoutProps = {
  transactionalEmails: React.ReactNode;
  marketingEmails: React.ReactNode;
};

export default function NotificationsLayout({
  transactionalEmails,
  marketingEmails
}: NotificationsLayoutProps): React.JSX.Element {
  return (
    <AnnotatedLayout className="py-0">
      {transactionalEmails}
      <Separator />
      {marketingEmails}
    </AnnotatedLayout>
  );
}
