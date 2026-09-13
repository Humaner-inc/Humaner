'use client';

import * as React from 'react';
import { getAppUrl } from '@humaner/shared/urls';

import { CopyBlock } from '@/components/dashboard/integrations/copy-block';
import { buildMcpServerConfig } from '@/lib/developers/mcp-server-config';

export function McpServerConfigPanel(): React.JSX.Element {
  const config = React.useMemo(() => buildMcpServerConfig(getAppUrl()), []);

  return (
    <div className="space-y-2">
      <CopyBlock
        value={config}
        language="json"
      />
      <p className="text-xs text-muted-foreground">
        Paste into your MCP server config. Replace Your_api_key with one created
        below.
      </p>
    </div>
  );
}
