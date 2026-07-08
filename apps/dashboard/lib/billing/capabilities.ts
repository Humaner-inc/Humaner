import 'server-only';

import type { CharacterType } from '@prisma/client';
import {
  getPlanCapabilities,
  getPlanForTier,
  type PlanCapabilities
} from '@humaner/shared/plans';

import { prisma } from '@/lib/db/prisma';

/**
 * Resolve the runtime capability matrix for an organization from its plan tier.
 * Single source of truth for feature gating in server actions.
 */
export async function getOrganizationCapabilities(
  organizationId: string
): Promise<PlanCapabilities> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true }
  });

  return getPlanCapabilities(organization?.tier ?? 'free');
}

/** Enforce plan personality access when persisting agent character settings. */
export function resolveAllowedAgentCharacter(
  character: CharacterType,
  capabilities: PlanCapabilities
): CharacterType {
  return capabilities.personalities === 'all' || character === 'CORPORATE'
    ? character
    : 'CORPORATE';
}

/** Human-readable plan name for upgrade prompts. */
export async function getOrganizationPlanName(
  organizationId: string
): Promise<string> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true }
  });

  return getPlanForTier(organization?.tier ?? 'free').name;
}
