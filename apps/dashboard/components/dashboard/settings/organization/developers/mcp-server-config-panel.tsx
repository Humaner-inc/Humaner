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
        Paste into Cursor, Claude, or VS Code. Enable the server — a browser
        login connects this workspace. API keys below are for scripts and REST.
      </p>
    </div>
  );
}
