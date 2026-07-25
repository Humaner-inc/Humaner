import type { PlanTier } from '@humaner/shared/plans';

/** Accent colors used for plan badges and selection states across the dashboard. */
export const PLAN_TIER_ACCENT: Record<PlanTier, string> = {
  free: '#7b7b73',
  classic: '#6b8cae',
  refined: '#0047ab',
  frontier: '#c9ae84',
  humaner: '#e1ccaf'
};

export function getPlanTierAccent(tier: string): string {
  return PLAN_TIER_ACCENT[tier as PlanTier] ?? PLAN_TIER_ACCENT.free;
}
