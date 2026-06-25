import * as React from 'react';

import { TransactionalEmailsCard } from '@/components/dashboard/settings/account/notifications/transactional-emails-card';
import { getTransactionalEmails } from '@/data/account/get-transactional-emails';

export default async function TransactionalEmailsPage(): Promise<React.JSX.Element> {
  const settings = await getTransactionalEmails();
  return <TransactionalEmailsCard settings={settings} />;
}
