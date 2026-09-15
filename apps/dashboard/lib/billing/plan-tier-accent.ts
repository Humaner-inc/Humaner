import type { PlanTier } from '@humaner/shared/plans';

/** Accent colors used for plan badges and selection states across the dashboard. */
export const PLAN_TIER_ACCENT: Record<PlanTier, string> = {
  /** Free look-around */
  free: '#7b7b73',
  /** Inbox — cobalt */
  classic: '#001afc'
};

export function getPlanTierAccent(tier: string): string {
  return PLAN_TIER_ACCENT[tier as PlanTier] ?? PLAN_TIER_ACCENT.free;
}
