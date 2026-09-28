import * as React from 'react';
import type { Metadata } from 'next';

import { McpIcon } from '@/components/brand/mcp-icon';
import { McpIntelligenceToggle } from '@/components/dashboard/settings/organization/developers/mcp-intelligence-toggle';
import { McpOAuthClientsCard } from '@/components/dashboard/settings/organization/developers/mcp-oauth-clients-card';
import { McpServerConfigPanel } from '@/components/dashboard/settings/organization/developers/mcp-server-config-panel';
import { PresentationPageMark } from '@/components/dashboard/workspace-page-shell';
import { Routes } from '@/constants/routes';
import { getMcpOAuthGrants } from '@/data/developers/get-mcp-oauth-grants';
import { getMcpIntelligenceEnabled } from '@/data/developers/mcp-intelligence-mode';
import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';
import { cn } from '@/lib/utils';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.Developers
);

export type DevelopersLayoutProps = {
  apiKeys: React.ReactNode;
  webhooks: React.ReactNode;
  mcpLogs: React.ReactNode;
};

export default async function DevelopersLayout({
  apiKeys,
  webhooks,
  mcpLogs
}: DevelopersLayoutProps): Promise<React.JSX.Element> {
  const [mcpIntelligenceEnabled, oauthGrants] = await Promise.all([
    getMcpIntelligenceEnabled(),
    getMcpOAuthGrants()
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3.5">
        <PresentationPageMark className="border border-border/60 bg-[#0A0D0D] text-[#fcf4ec]">
          <McpIcon
            variant="glyph"
            className="size-6"
          />
        </PresentationPageMark>
        <h1 className="page-title">MCP</h1>
      </header>

      <section className={cn(dashboardSurfaceClassName, 'overflow-hidden')}>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <McpServerConfigPanel />
          <McpIntelligenceToggle enabled={mcpIntelligenceEnabled} />
        </div>

        <div className="border-t border-border/40" />

        <div className="px-5 py-4 sm:px-6">
          <h2 className="mb-3 text-sm font-medium text-foreground">
            Connected clients
          </h2>
          <McpOAuthClientsCard grants={oauthGrants} />
        </div>

        <div className="border-t border-border/40" />

        <div className="px-5 py-4 sm:px-6">
          <h2 className="mb-3 text-sm font-medium text-foreground">API keys</h2>
          {apiKeys}
        </div>

        <div className="border-t border-border/40" />

        <div className="px-5 py-4 sm:px-6">
          <h2 className="mb-3 text-sm font-medium text-foreground">Webhooks</h2>
          {webhooks}
        </div>

        <div className="border-t border-border/40" />

        <div className="px-5 py-4 sm:px-6">
          <h2 className="mb-3 text-sm font-medium text-foreground">Logs</h2>
          {mcpLogs}
        </div>
      </section>
    </div>
  );
}
