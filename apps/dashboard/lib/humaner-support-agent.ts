import 'server-only';

import {
  getPlanCapabilities,
  type PlanCapabilities,
  type PlanTier
} from '@humaner/shared/plans';

import { getHumanerAgentPublicId } from '@/lib/humaner-agent';

/** Runtime tier used for the Humaner platform support agent (full memory stack). */
export const HUMANER_SUPPORT_MEMORY_TIER: PlanTier = 'delegate';

export function isHumanerSupportAgent(
  publicId: string | null | undefined
): boolean {
  const configured = getHumanerAgentPublicId();
  return Boolean(configured && publicId && publicId === configured);
}

/** Stable visitor key for a logged-in dashboard user talking to Humaner support. */
export function buildDashboardVisitorId(userId: string): string {
  return `humaner_dash_${userId}`;
}

export function getHumanerSupportPlanCapabilities(): PlanCapabilities {
  return getPlanCapabilities(HUMANER_SUPPORT_MEMORY_TIER);
}

export function resolveAgentChatCapabilities(
  agentPublicId: string,
  organizationTier: string
): PlanCapabilities {
  if (isHumanerSupportAgent(agentPublicId)) {
    return getHumanerSupportPlanCapabilities();
  }

  return getPlanCapabilities(organizationTier);
}

export function resolveAgentChatTier(
  agentPublicId: string,
  organizationTier: string
): string {
  if (isHumanerSupportAgent(agentPublicId)) {
    return HUMANER_SUPPORT_MEMORY_TIER;
  }

  return organizationTier;
}
