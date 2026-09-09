/**
 * Humaner credits wallet — published overage and the cost audit behind it.
 *
 * overage = LLM + wrappers + infra + polarTake + margin
 * Public rate: $0.07 / agent reply (7 cents).
 */

/** Claude Sonnet 5 list rates (USD / million tokens), Aug 2026 standard. */
export const CLAUDE_SONNET_5_INPUT_PER_MTOK = 2;
export const CLAUDE_SONNET_5_OUTPUT_PER_MTOK = 10;
export const CLAUDE_SONNET_5_CACHE_READ_PER_MTOK = 0.2;
export const CLAUDE_SONNET_5_CACHE_WRITE_5M_PER_MTOK = 2.5;

/** Sonnet 4.5 fallback (simple / near-cache route). */
export const CLAUDE_SONNET_45_INPUT_PER_MTOK = 3;
export const CLAUDE_SONNET_45_OUTPUT_PER_MTOK = 15;
export const CLAUDE_SONNET_45_CACHE_READ_PER_MTOK = 0.3;

/** Typical hosted turn token mix. */
export const TYPICAL_CACHED_PREFIX_TOKENS = 8_000;
export const TYPICAL_UNCACHED_INPUT_TOKENS = 3_500;
export const TYPICAL_OUTPUT_TOKENS = 500;
export const TYPICAL_SONNET_45_OUTPUT_TOKENS = 400;

/** Traffic mix used to blend LLM COGS. */
export const MIX_SONNET_5_WARM = 0.7;
export const MIX_SONNET_5_COLD = 0.15;
export const MIX_SONNET_45_WARM = 0.1;
export const MIX_LANGCACHE_HIT = 0.05;

export const LLM_SONNET_5_WARM =
  (TYPICAL_CACHED_PREFIX_TOKENS * CLAUDE_SONNET_5_CACHE_READ_PER_MTOK +
    TYPICAL_UNCACHED_INPUT_TOKENS * CLAUDE_SONNET_5_INPUT_PER_MTOK +
    TYPICAL_OUTPUT_TOKENS * CLAUDE_SONNET_5_OUTPUT_PER_MTOK) /
  1_000_000;

export const LLM_SONNET_5_COLD =
  (TYPICAL_CACHED_PREFIX_TOKENS * CLAUDE_SONNET_5_CACHE_WRITE_5M_PER_MTOK +
    TYPICAL_UNCACHED_INPUT_TOKENS * CLAUDE_SONNET_5_INPUT_PER_MTOK +
    TYPICAL_OUTPUT_TOKENS * CLAUDE_SONNET_5_OUTPUT_PER_MTOK) /
  1_000_000;

export const LLM_SONNET_45_WARM =
  (TYPICAL_CACHED_PREFIX_TOKENS * CLAUDE_SONNET_45_CACHE_READ_PER_MTOK +
    TYPICAL_UNCACHED_INPUT_TOKENS * CLAUDE_SONNET_45_INPUT_PER_MTOK +
    TYPICAL_SONNET_45_OUTPUT_TOKENS * CLAUDE_SONNET_45_OUTPUT_PER_MTOK) /
  1_000_000;

export const LLM_BLENDED =
  MIX_SONNET_5_WARM * LLM_SONNET_5_WARM +
  MIX_SONNET_5_COLD * LLM_SONNET_5_COLD +
  MIX_SONNET_45_WARM * LLM_SONNET_45_WARM +
  MIX_LANGCACHE_HIT * 0;

/** Embed + Cohere rerank (half of turns) + LangCache probe. */
export const WRAPPERS_PER_REPLY = 0.0008;

/** Vercel + Neon + Redis + logs, padded. */
export const INFRA_PER_REPLY = 0.002;

export const VARIABLE_COGS_PER_REPLY =
  LLM_BLENDED + WRAPPERS_PER_REPLY + INFRA_PER_REPLY;

/** Early Member Polar take on a $20 pack (4% + 40¢) as a fraction of pack. */
export const POLAR_TAKE_RATE_ON_20_PACK = 0.06;

export const MESSAGE_RATE_CENTS = 7;
export const MESSAGE_RATE_USD = MESSAGE_RATE_CENTS / 100;

export const POLAR_TAKE_PER_PAID_REPLY =
  MESSAGE_RATE_USD * POLAR_TAKE_RATE_ON_20_PACK;

export const FULLY_LOADED_COST_PER_REPLY =
  VARIABLE_COGS_PER_REPLY + POLAR_TAKE_PER_PAID_REPLY;

export const GROSS_PROFIT_PER_PAID_REPLY =
  MESSAGE_RATE_USD - FULLY_LOADED_COST_PER_REPLY;

export const PAID_GROSS_MARGIN = GROSS_PROFIT_PER_PAID_REPLY / MESSAGE_RATE_USD;

export const STARTER_CREDIT_CENTS = 2_000;
export const STARTER_CREDIT_USD = STARTER_CREDIT_CENTS / 100;

export const STARTER_INCLUDED_REPLIES = Math.floor(
  STARTER_CREDIT_CENTS / MESSAGE_RATE_CENTS,
);

export function starterCashCost(utilization: number): number {
  const burned = Math.min(1, Math.max(0, utilization));
  return STARTER_INCLUDED_REPLIES * VARIABLE_COGS_PER_REPLY * burned;
}

export const CREDIT_PACKS_USD = [20, 50, 150] as const;

export const MIN_CUSTOM_RECHARGE_USD = 20;

/** Polar one-time products for prepaid packs — not subscriptions, no trial. */
export const POLAR_CREDIT_PACK_ENV_KEYS = {
  20: "POLAR_PRODUCT_CREDITS_20_ID",
  50: "POLAR_PRODUCT_CREDITS_50_ID",
  150: "POLAR_PRODUCT_CREDITS_150_ID",
} as const;

/** One-time product used with Polar ad-hoc / custom checkout amounts (min $20). */
export const POLAR_CREDIT_CUSTOM_ENV_KEY = "POLAR_PRODUCT_CREDITS_CUSTOM_ID";

/** Recurring Polar add-ons billed monthly. */
export const POLAR_ADDON_ENV_KEYS = {
  seatMonth: "POLAR_PRODUCT_ADDON_SEAT_MONTH_ID",
  agentMonth: "POLAR_PRODUCT_ADDON_AGENT_MONTH_ID",
  inboxMonth: "POLAR_PRODUCT_ADDON_INBOX_MONTH_ID",
} as const;

export function repliesFromCreditCents(cents: number): number {
  if (cents <= 0) return 0;
  return Math.floor(cents / MESSAGE_RATE_CENTS);
}

export function creditsFromReplies(replies: number): number {
  if (replies <= 0) return 0;
  return replies * MESSAGE_RATE_CENTS;
}

export function formatCreditUsd(cents: number): string {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}
