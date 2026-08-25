import type { PlanCapabilities } from '@humaner/shared/plans';
import { getPlanCapabilities } from '@humaner/shared/plans';

import { isCustomAgentWorkspace } from '@/constants/agent-nav-items';
import { integrationChannelRoute, Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import {
  HOSTED_EMBED_CHANNEL_IDS,
  INTEGRATION_CHANNELS,
  type IntegrationChannel
} from '@/lib/integrations';
import { toPublicPathname } from '@/lib/routes/public-pathname';

export type IntegrationNavTab = {
  id: string;
  label: string;
  href: string;
  channel: IntegrationChannel;
  requiredCapability?: keyof PlanCapabilities;
};

const CHANNEL_CAPABILITY_GATE: Record<string, keyof PlanCapabilities> = {
  widget: 'hostedAgent',
  react: 'hostedAgent',
  'hosted-link': 'hostedAgent',
  'rest-api': 'apiAccess',
  'env-example': 'apiAccess'
};

/** Custom workspaces use Environment instead of Integrations in the sidebar. */
export function getIntegrationsSidebarLabel(orgTier: string): string {
  return isCustomAgentWorkspace(orgTier) ? 'Environment' : 'Integrations';
}

const CUSTOM_ENVIRONMENT_CHANNEL_IDS = ['rest-api', 'env-example'] as const;

export function isIntegrationLocked(
  channelId: string,
  orgTier: string
): boolean {
  if (isOssDeployment()) {
    return false;
  }
  const cap = CHANNEL_CAPABILITY_GATE[channelId];
  if (!cap) return false;
  const capabilities = getPlanCapabilities(orgTier);
  return !capabilities[cap];
}

export const INTEGRATION_NAV_TABS: IntegrationNavTab[] =
  INTEGRATION_CHANNELS.map((channel) => ({
    id: channel.id,
    label: channel.name,
    href: integrationChannelRoute(channel.id),
    channel
  }));

/** Hide Native-only embeds on BYO; keep locked API as an upgrade row. */
export function getVisibleIntegrationNavTabs(
  orgTier: string
): IntegrationNavTab[] {
  if (isCustomAgentWorkspace(orgTier)) {
    return INTEGRATION_NAV_TABS.filter((tab) =>
      (CUSTOM_ENVIRONMENT_CHANNEL_IDS as readonly string[]).includes(tab.id)
    );
  }

  return INTEGRATION_NAV_TABS.filter((tab) => {
    // Env.example is Custom-only — hosted plans use widget/API embed paths instead.
    if (tab.id === 'env-example') {
      return false;
    }
    if (!HOSTED_EMBED_CHANNEL_IDS.has(tab.id)) {
      return true;
    }
    return !isIntegrationLocked(tab.id, orgTier);
  });
}

export function getDefaultIntegrationChannelId(orgTier: string): string {
  if (isCustomAgentWorkspace(orgTier)) {
    return 'rest-api';
  }
  return getVisibleIntegrationNavTabs(orgTier)[0]?.id ?? 'rest-api';
}

export function getActiveIntegrationChannelId(pathname: string): string | null {
  const publicPath = toPublicPathname(pathname);
  const match = publicPath.match(/^\/integrations\/([^/]+)/);
  return match?.[1] ?? null;
}

export function isIntegrationsPath(pathname: string): boolean {
  const publicPath = toPublicPathname(pathname);
  return publicPath.startsWith(Routes.Integrations);
}

export function isValidIntegrationChannelId(channelId: string): boolean {
  return INTEGRATION_NAV_TABS.some((tab) => tab.id === channelId);
}
