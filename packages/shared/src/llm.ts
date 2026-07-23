import { getPlanForTier, normalizePlanTier, type PlanTier } from "./plans";

export type LlmConfig = {
  model: string;
  maxContextTokens: number;
  maxHistoryTurns: number;
  maxOutputTokens: number;
};

const OUTPUT_TOKEN_CAPS: Record<PlanTier, number> = {
  free: 512,
  classic: 768,
  refined: 768,
  frontier: 1_024,
  humaner: 2_048,
};

export function getLlmConfigForTier(tier: string): LlmConfig {
  const planTier = normalizePlanTier(tier);
  const plan = getPlanForTier(planTier);

  return {
    model: plan.model,
    maxContextTokens: plan.maxContextTokens,
    maxHistoryTurns: plan.maxHistoryTurns,
    maxOutputTokens: OUTPUT_TOKEN_CAPS[planTier],
  };
}

export function isPaidTier(tier: string): boolean {
  return normalizePlanTier(tier) !== "free";
}
