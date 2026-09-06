import type { PlanTier } from '@humaner/shared/plans';

/** Accent colors used for plan badges and selection states across the dashboard. */
export const PLAN_TIER_ACCENT: Record<PlanTier, string> = {
  /** Self-host */
  free: '#7b7b73',
  /** Custom — Humaner orange */
  byo: '#f85919',
  /** Humaner — cobalt */
  classic: '#2252bc',
  humaner: '#f85919'
};

export function getPlanTierAccent(tier: string): string {
  return PLAN_TIER_ACCENT[tier as PlanTier] ?? PLAN_TIER_ACCENT.free;
}
