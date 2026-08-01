import 'server-only';

import {
  UNLIMITED_AGENTS as SHARED_UNLIMITED_AGENTS,
  type PlanDefinition
} from '@humaner/shared/plans';
import { Role } from '@prisma/client';

import { isAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

/** Unlimited agent slots when plan limits are bypassed. */
export const UNLIMITED_AGENTS = SHARED_UNLIMITED_AGENTS;
export const UNLIMITED_MEMBERS = 999;

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

export function getEffectiveMemberLimit(
  plan: PlanDefinition,
  bypassLimits: boolean
): number {
  return bypassLimits ? UNLIMITED_MEMBERS : plan.members;
}

/** Live (non-paused) agents count toward the plan slot limit — like Supabase projects. */
export function hasReachedAgentLimit(
  liveAgentCount: number,
  plan: PlanDefinition,
  bypassLimits: boolean
): boolean {
  if (bypassLimits || plan.agents >= UNLIMITED_AGENTS) {
    return false;
  }

  return liveAgentCount >= plan.agents;
}

export function hasReachedMemberLimit(
  seatCount: number,
  plan: PlanDefinition,
  bypassLimits: boolean
): boolean {
  if (bypassLimits) {
    return false;
  }

  return seatCount >= plan.members;
}

export async function getLiveAgentCount(
  organizationId: string
): Promise<number> {
  return prisma.agent.count({
    where: { organizationId, isPaused: false }
  });
}
