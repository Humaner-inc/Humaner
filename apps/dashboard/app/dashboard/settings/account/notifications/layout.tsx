import * as React from 'react';
import type { Metadata } from 'next';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Notifications')
};

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
