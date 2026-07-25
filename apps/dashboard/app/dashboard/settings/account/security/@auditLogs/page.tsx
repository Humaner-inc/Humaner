import * as React from 'react';
import { redirect } from 'next/navigation';

import { AuditLogsCard } from '@/components/dashboard/settings/organization/audit-logs/audit-logs-card';
import { getAuditLogs } from '@/data/audit-logs/get-audit-logs';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { isWorkspaceOwner } from '@/lib/auth/workspace-permissions';

export default async function AuditLogsPage(): Promise<React.JSX.Element | null> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  if (!(await isWorkspaceOwner(session.user.id))) {
    return null;
  }

  const logs = await getAuditLogs({ limit: 100 });
  return <AuditLogsCard logs={logs} />;
}
