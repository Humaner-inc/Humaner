import * as React from 'react';

import { SessionsCard } from '@/components/dashboard/settings/account/security/sessions-card';
import { getSessions } from '@/data/account/get-sessions';

export default async function ManageSessionsPage(): Promise<React.JSX.Element> {
  const sessions = await getSessions();
  return <SessionsCard sessions={sessions} />;
}
