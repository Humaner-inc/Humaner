import type { PlanTier } from '@humaner/shared/plans';

/**
 * Self-Host (OSS) twin of `lib/billing/tier.ts`.
 *
 * Cloud checkout and Polar product IDs stay private. The public kit only needs
 * to normalize leftover tier strings from the database. josh renames this onto
 * `tier.ts`.
 */

export enum Tier {
  Free = 'free',
  Classic = 'classic'
}

export type BillingInterval = 'month' | 'year';

export const displayNames: Record<Tier, string> = {
  [Tier.Free]: 'Self-Host',
  [Tier.Classic]: 'Self-Host'
};

export function isValidTier(value: string): value is Tier {
  return Object.values(Tier).includes(value as Tier);
}

const RETIRED_PAID_TIERS = new Set([
  'byo',
  'humaner',
  'frontier',
  'refined',
  'grow',
  'native'
]);

export function normalizeTier(value: string): Tier {
  const normalized = value.trim().toLowerCase();
  if (RETIRED_PAID_TIERS.has(normalized)) {
    return Tier.Classic;
  }
  if (Object.values(Tier).includes(normalized as Tier)) {
    return normalized as Tier;
  }

  return Tier.Free;
}

export function toPlanTier(tier: Tier): PlanTier {
  return tier === Tier.Classic ? 'classic' : 'free';
}
