import type { PlanCapabilities } from '@humaner/shared/plans';
import { getPlanCapabilities } from '@humaner/shared/plans';

import { integrationChannelRoute } from '@/constants/routes';
import {
  INTEGRATION_CHANNELS,
  INTEGRATION_DOCK_ORDER,
  type IntegrationChannel
} from '@/lib/integrations';

export type IntegrationNavTab = {
  id: string;
  label: string;
  href: string;
  channel: IntegrationChannel;
  requiredCapability?: keyof PlanCapabilities;
};

const CHANNEL_CAPABILITY_GATE: Record<string, keyof PlanCapabilities> = {
  'rest-api': 'apiAccess'
};

export function isIntegrationLocked(
  channelId: string,
  orgTier: string
): boolean {
  const cap = CHANNEL_CAPABILITY_GATE[channelId];
  if (!cap) return false;
  const capabilities = getPlanCapabilities(orgTier);
  return !capabilities[cap];
}

export const INTEGRATION_NAV_TABS: IntegrationNavTab[] =
  INTEGRATION_DOCK_ORDER.map((id) => {
    const channel = INTEGRATION_CHANNELS.find((item) => item.id === id);
    if (!channel) {
      throw new Error(`Unknown integration channel: ${id}`);
    }
    return {
      id: channel.id,
      label: channel.name,
      href: integrationChannelRoute(channel.id),
      channel
    };
  });

export function getActiveIntegrationChannelId(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/integrations\/([^/]+)/);
  return match?.[1] ?? null;
}

export function isIntegrationsPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/integrations');
}

export function isValidIntegrationChannelId(channelId: string): boolean {
  return INTEGRATION_NAV_TABS.some((tab) => tab.id === channelId);
}
