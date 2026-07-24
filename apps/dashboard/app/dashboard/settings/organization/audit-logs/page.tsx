import * as React from 'react';

import { AuditLogsCard } from '@/components/dashboard/settings/organization/audit-logs/audit-logs-card';
import { getAuditLogs } from '@/data/audit-logs/get-audit-logs';

export default async function AuditLogsPage(): Promise<React.JSX.Element> {
  const logs = await getAuditLogs({ limit: 100 });
  return <AuditLogsCard logs={logs} />;
}
