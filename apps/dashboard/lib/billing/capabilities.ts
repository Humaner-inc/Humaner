import 'server-only';

import { cache } from 'react';
import {
  getPlanCapabilities,
  getPlanForTier,
  type PlanCapabilities
} from '@humaner/shared/plans';
import type { CharacterType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { PreConditionError } from '@/lib/validation/exceptions';

/**
 * Resolve the runtime capability matrix for an organization from its plan tier.
 * Single source of truth for feature gating in server actions.
 * Deduped within a single RSC request via React.cache.
 */
export const getOrganizationCapabilities = cache(
  async (organizationId: string): Promise<PlanCapabilities> => {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tier: true, frontierBetaEnabled: true }
    });

    return getPlanCapabilities(organization?.tier ?? 'free', {
      frontierBetaEnabled: organization?.frontierBetaEnabled ?? false
    });
  }
);

/** Throw when a paid capability is missing for the org's current plan. */
export async function requireOrganizationCapability(
  organizationId: string,
  capability: keyof PlanCapabilities,
  message: string
): Promise<PlanCapabilities> {
  const capabilities = await getOrganizationCapabilities(organizationId);
  if (!capabilities[capability]) {
    throw new PreConditionError(message);
  }
  return capabilities;
}

/** Enforce plan personality access when persisting agent character settings. */
export function resolveAllowedAgentCharacter(
  character: CharacterType,
  capabilities: PlanCapabilities
): CharacterType {
  if (capabilities.personalities === 'all') return character;
  return 'CUSTOM';
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
