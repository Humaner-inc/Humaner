import * as React from 'react';

import { McpRequestLogsSkeleton } from '@/components/dashboard/settings/organization/developers/mcp-request-logs-skeleton';

export default function McpLogsLoading(): React.JSX.Element {
  return <McpRequestLogsSkeleton />;
}
