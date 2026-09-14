/**
 * Humaner credits wallet — published overage and the cost audit behind it.
 *
 * overage = LLM + wrappers + infra + polarTake + margin
 * Public rate: $0.07 / Companion reply (7 cents).
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

export const MIN_CUSTOM_RECHARGE_USD = 10;

export const AUTO_RELOAD_THRESHOLD_USD = [5, 10, 20] as const;
export const DEFAULT_AUTO_RELOAD_THRESHOLD_USD = 5;
export const DEFAULT_AUTO_RELOAD_THRESHOLD_CENTS =
  DEFAULT_AUTO_RELOAD_THRESHOLD_USD * 100;
export const DEFAULT_AUTO_RELOAD_AMOUNT_USD = 20;
export const DEFAULT_AUTO_RELOAD_AMOUNT_CENTS =
  DEFAULT_AUTO_RELOAD_AMOUNT_USD * 100;

/** Polar one-time products for prepaid packs — not subscriptions, no trial. */
export const POLAR_CREDIT_PACK_ENV_KEYS = {
  20: "POLAR_PRODUCT_CREDITS_20_ID",
  50: "POLAR_PRODUCT_CREDITS_50_ID",
  150: "POLAR_PRODUCT_CREDITS_150_ID",
} as const;

/** One-time product used with Polar ad-hoc / custom checkout amounts (min $10). */
export const POLAR_CREDIT_CUSTOM_ENV_KEY = "POLAR_PRODUCT_CREDITS_CUSTOM_ID";

export const MIN_POLAR_CREDIT_GRANT_CENTS = MIN_CUSTOM_RECHARGE_USD * 100;
export const MAX_POLAR_CREDIT_GRANT_CENTS = 1_000_000;

export function polarCreditProductEnvKeys(): string[] {
  return [
    ...Object.values(POLAR_CREDIT_PACK_ENV_KEYS),
    POLAR_CREDIT_CUSTOM_ENV_KEY,
  ];
}

export function polarCreditProductIdsFromEnv(
  env: Record<string, string | undefined>,
): string[] {
  const ids: string[] = [];
  for (const key of polarCreditProductEnvKeys()) {
    const value = env[key]?.trim();
    if (value) {
      ids.push(value);
    }
  }
  return ids;
}

export type PolarCreditOrderInput = {
  id?: string | null;
  customerId?: string | null;
  productId?: string | null;
  productIds?: Array<string | null | undefined>;
  amount?: number | null;
  netAmount?: number | null;
  billingReason?: string | null;
  subscriptionId?: string | null;
};

export type PolarCreditGrantDecision =
  | {
      ok: true;
      orderId: string;
      customerId: string;
      productId: string;
      cents: number;
    }
  | { ok: false; reason: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readNumber(
  record: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function productIdsFromPolarOrder(order: Record<string, unknown>): string[] {
  const ids: string[] = [];
  const direct = readString(order, "productId", "product_id");
  if (direct) {
    ids.push(direct);
  }

  const product = asRecord(order.product);
  const nested = readString(product, "id");
  if (nested) {
    ids.push(nested);
  }

  const products = order.products;
  if (Array.isArray(products)) {
    for (const item of products) {
      if (typeof item === "string" && item.trim()) {
        ids.push(item.trim());
        continue;
      }
      const id = readString(asRecord(item), "id", "productId", "product_id");
      if (id) {
        ids.push(id);
      }
    }
  }

  const items = order.items;
  if (Array.isArray(items)) {
    for (const item of items) {
      const record = asRecord(item);
      const id = readString(record, "productId", "product_id");
      if (id) {
        ids.push(id);
        continue;
      }
      const nested = readString(asRecord(record.product), "id");
      if (nested) {
        ids.push(nested);
      }
    }
  }

  return [...new Set(ids)];
}

/** Normalize Polar webhook camelCase / snake_case order payloads. */
export function polarOrderToCreditInput(order: unknown): PolarCreditOrderInput {
  const record = asRecord(order);
  const productIds = productIdsFromPolarOrder(record);
  return {
    id: readString(record, "id"),
    customerId: readString(record, "customerId", "customer_id"),
    productId: productIds[0] ?? null,
    productIds,
    amount: readNumber(record, "amount"),
    netAmount: readNumber(record, "netAmount", "net_amount"),
    billingReason: readString(record, "billingReason", "billing_reason"),
    subscriptionId: readString(record, "subscriptionId", "subscription_id"),
  };
}

function firstProductId(order: PolarCreditOrderInput): string | null {
  if (order.productId && order.productId.trim()) {
    return order.productId.trim();
  }
  for (const id of order.productIds ?? []) {
    if (typeof id === "string" && id.trim()) {
      return id.trim();
    }
  }
  return null;
}

function paidCentsFromOrder(order: PolarCreditOrderInput): number {
  const amount = Number(order.amount);
  if (Number.isFinite(amount) && amount > 0) {
    return Math.trunc(amount);
  }
  const net = Number(order.netAmount);
  if (Number.isFinite(net) && net > 0) {
    return Math.trunc(net);
  }
  return 0;
}

/**
 * Wallet credits come only from a verified Polar credit-product purchase.
 * Subscription renewals, add-ons, and unknown products never grant.
 */
export function resolvePolarCreditGrant(
  order: PolarCreditOrderInput,
  creditProductIds: readonly string[],
): PolarCreditGrantDecision {
  const orderId = order.id?.trim();
  if (!orderId) {
    return { ok: false, reason: "missing_order_id" };
  }

  const customerId = order.customerId?.trim();
  if (!customerId) {
    return { ok: false, reason: "missing_customer_id" };
  }

  const billingReason = (order.billingReason ?? "").toLowerCase();
  if (billingReason.startsWith("subscription")) {
    return { ok: false, reason: "subscription_order" };
  }

  const productIds = [
    ...new Set(
      [order.productId, ...(order.productIds ?? [])]
        .filter(
          (id): id is string => typeof id === "string" && Boolean(id.trim()),
        )
        .map((id) => id.trim()),
    ),
  ];
  const productId = firstProductId(order) ?? productIds[0] ?? null;
  if (!productId) {
    return { ok: false, reason: "missing_product_id" };
  }

  const allowed = new Set(
    creditProductIds.filter((id) => typeof id === "string" && id.trim()),
  );
  if (allowed.size === 0) {
    return { ok: false, reason: "no_credit_products_configured" };
  }
  if (!productIds.every((id) => allowed.has(id))) {
    return { ok: false, reason: "not_credit_product" };
  }

  const cents = paidCentsFromOrder(order);
  if (cents < MIN_POLAR_CREDIT_GRANT_CENTS) {
    return { ok: false, reason: "amount_below_minimum" };
  }
  if (cents > MAX_POLAR_CREDIT_GRANT_CENTS) {
    return { ok: false, reason: "amount_above_maximum" };
  }

  return { ok: true, orderId, customerId, productId, cents };
}

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

export type CreditUsageSnapshot = {
  usedCents: number;
  remainingCents: number;
  includedCents: number;
  exhausted: boolean;
  usagePercent: number;
};

/**
 * One pipeline: monthly reply count → cents at $0.07, then remaining.
 * Credits wallets use the owner balance. Polar volume keeps the monthly allotment.
 */
export function resolveCreditUsage(input: {
  billingModel?: string | null;
  creditBalanceCents?: number | null;
  messagesUsed: number;
  includedMessages: number;
}): CreditUsageSnapshot {
  const usedCents = creditsFromReplies(input.messagesUsed);

  if (isCreditsBillingModel(input.billingModel)) {
    const remainingCents = Math.max(0, input.creditBalanceCents ?? 0);
    const includedCents = remainingCents + usedCents;
    const usagePercent =
      includedCents > 0 ? Math.round((usedCents / includedCents) * 100) : 0;
    return {
      usedCents,
      remainingCents,
      includedCents,
      exhausted: remainingCents < MESSAGE_RATE_CENTS,
      usagePercent: Math.min(100, usagePercent),
    };
  }

  const includedCents = creditsFromReplies(input.includedMessages);
  const remainingCents = Math.max(0, includedCents - usedCents);
  const usagePercent =
    includedCents > 0 ? Math.round((usedCents / includedCents) * 100) : 0;
  return {
    usedCents,
    remainingCents,
    includedCents,
    exhausted: includedCents > 0 && usedCents >= includedCents,
    usagePercent: Math.min(100, usagePercent),
  };
}

/** Prepaid wallet. Polar volume subscribers stay on `subscription`. */
export const BILLING_MODEL_CREDITS = "credits" as const;
export const BILLING_MODEL_SUBSCRIPTION = "subscription" as const;

export type BillingModel =
  | typeof BILLING_MODEL_CREDITS
  | typeof BILLING_MODEL_SUBSCRIPTION;

export function isCreditsBillingModel(
  value: string | null | undefined,
): boolean {
  return value === BILLING_MODEL_CREDITS;
}

export type StarterCreditGrantDecision =
  | "grant"
  | "already_granted"
  | "keep_subscription";

/**
 * $20 starter is owner-only, once, and only for a new Humaner (classic) pick.
 * Existing Polar volume / Custom subscribers stay on `subscription`.
 */
export function decideStarterCreditGrant(account: {
  tier: string;
  billingModel?: string | null;
  starterCreditGrantedAt?: Date | string | null;
}): StarterCreditGrantDecision {
  if (account.starterCreditGrantedAt) {
    return "already_granted";
  }

  const model = account.billingModel ?? BILLING_MODEL_SUBSCRIPTION;
  if (model === BILLING_MODEL_CREDITS) {
    return "grant";
  }

  if (account.tier.toLowerCase() !== "free") {
    return "keep_subscription";
  }

  return "grant";
}
