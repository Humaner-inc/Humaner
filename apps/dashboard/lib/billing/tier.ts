import type { PlanTier } from '@humaner/shared/plans';

/**
 * Self-Host (OSS) twin of `lib/billing/tier.ts`.
 *
 * Cloud checkout, Polar product IDs, and volume steps stay private. The public
 * kit only needs to normalize leftover tier strings from the database.
 * josh renames this onto `tier.ts`.
 */

export enum Tier {
  Free = 'free',
  Byo = 'byo',
  Classic = 'classic',
  Frontier = 'frontier',
  Humaner = 'humaner'
}

export type BillingInterval = 'month' | 'year';

export const displayNames: Record<Tier, string> = {
  [Tier.Free]: 'Self-Host',
  [Tier.Byo]: 'Self-Host',
  [Tier.Classic]: 'Self-Host',
  [Tier.Frontier]: 'Self-Host',
  [Tier.Humaner]: 'Self-Host'
};

export function isValidTier(value: string): value is Tier {
  return Object.values(Tier).includes(value as Tier);
}

export function normalizeTier(value: string): Tier {
  const normalized = value.toLowerCase();
  if (normalized === 'refined' || normalized === 'grow') {
    return Tier.Classic;
  }
  if (normalized === 'native') {
    return Tier.Classic;
  }
  if (Object.values(Tier).includes(normalized as Tier)) {
    return normalized as Tier;
  }

  return Tier.Free;
}

export function toPlanTier(tier: Tier): PlanTier {
  if (tier === Tier.Frontier) {
    return 'classic';
  }
  return tier;
}
