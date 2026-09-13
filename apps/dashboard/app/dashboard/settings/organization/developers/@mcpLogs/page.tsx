import * as React from 'react';

import { McpRequestLogs } from '@/components/dashboard/settings/organization/developers/mcp-request-logs';
import { getMcpRequestLogs } from '@/data/mcp/get-mcp-request-logs';

export default async function McpLogsPage(): Promise<React.JSX.Element> {
  const logs = await getMcpRequestLogs();
  return <McpRequestLogs logs={logs} />;
}
