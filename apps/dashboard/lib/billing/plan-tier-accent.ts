import type { PlanTier } from '@humaner/shared/plans';

/** Accent colors used for plan badges and selection states across the dashboard. */
export const PLAN_TIER_ACCENT: Record<PlanTier, string> = {
  free: '#18181b',
  /** Cobalt — matches Humaner v1.0 */
  classic: '#2252bc',
  /** Accent — matches Humaner v2.0 */
  frontier: '#e0e1df',
  humaner: '#e0e1df'
};

export function getPlanTierAccent(tier: string): string {
  return PLAN_TIER_ACCENT[tier as PlanTier] ?? PLAN_TIER_ACCENT.free;
}
