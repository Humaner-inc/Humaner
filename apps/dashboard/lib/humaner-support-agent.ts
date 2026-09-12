import 'server-only';

import {
  getPlanCapabilities,
  type PlanCapabilities,
  type PlanCapabilityContext,
  type PlanTier
} from '@humaner/shared/plans';

import { getHumanerAgentPublicId } from '@/lib/humaner-agent';
import {
  getAgentForChat,
  type CachedChatAgent
} from '@/lib/redis/agent-config-cache';

/** Runtime tier for the landing-page Humaner visitor support agent. */
export const HUMANER_SUPPORT_MEMORY_TIER: PlanTier = 'humaner';

export function isHumanerSupportAgent(
  publicId: string | null | undefined
): boolean {
  const configured = getHumanerAgentPublicId();
  return Boolean(configured && publicId && publicId === configured);
}

/** Stable visitor key for a logged-in teammate talking to Companion. */
export function buildDashboardVisitorId(userId: string): string {
  return `humaner_dash_${userId}`;
}

/** Companion in the dashboard is the workspace agent, not the landing support widget. */
export async function requireWorkspaceCompanionAgent(
  publicId: string,
  organizationId: string
): Promise<CachedChatAgent | null> {
  const agent = await getAgentForChat(publicId);
  if (!agent || agent.organizationId !== organizationId) {
    return null;
  }
  return agent;
}

export function getHumanerSupportPlanCapabilities(): PlanCapabilities {
  return getPlanCapabilities(HUMANER_SUPPORT_MEMORY_TIER);
}

export function resolveAgentChatCapabilities(
  agentPublicId: string,
  organizationTier: string,
  frontierBetaEnabled?: boolean | null
): PlanCapabilities {
  if (isHumanerSupportAgent(agentPublicId)) {
    return getHumanerSupportPlanCapabilities();
  }

  const context: PlanCapabilityContext = { frontierBetaEnabled };
  return getPlanCapabilities(organizationTier, context);
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
