import type { PlanTier } from '@humaner/shared/plans';

/** Accent colors used for plan badges and selection states across the dashboard. */
export const PLAN_TIER_ACCENT: Record<PlanTier, string> = {
  free: '#7b7b73',
  /** Cobalt — matches Humaner v1.0 */
  classic: '#0682de',
  /** Legacy tier — keep distinct from Classic cobalt */
  refined: '#0047ab',
  /** Accent — matches Humaner v2.0 */
  frontier: '#e1ccaf',
  humaner: '#e1ccaf'
};

export function getPlanTierAccent(tier: string): string {
  return PLAN_TIER_ACCENT[tier as PlanTier] ?? PLAN_TIER_ACCENT.free;
}
