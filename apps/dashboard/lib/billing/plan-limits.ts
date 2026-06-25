import 'server-only';

import type { PlanDefinition } from '@humaner/shared/plans';
import { Role } from '@prisma/client';

import { isAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

/** Unlimited agent slots when plan limits are bypassed. */
export const UNLIMITED_AGENTS = 999;

export async function userBypassesPlanLimits(userId: string): Promise<boolean> {
  return isAdmin(userId);
}

export async function organizationBypassesPlanLimits(
  organizationId: string
): Promise<boolean> {
  const adminCount = await prisma.user.count({
    where: {
      organizationId,
      role: Role.ADMIN
    }
  });

  return adminCount > 0;
}

export function getEffectiveAgentLimit(
  plan: PlanDefinition,
  bypassLimits: boolean
): number {
  return bypassLimits ? UNLIMITED_AGENTS : plan.agents;
}

export function hasReachedAgentLimit(
  agentCount: number,
  plan: PlanDefinition,
  bypassLimits: boolean
): boolean {
  if (bypassLimits) {
    return false;
  }

  return agentCount >= plan.agents;
}
