/**
 * Seat and mailbox add-ons.
 *
 * Inbox includes one seat and one mailbox. Extra Member and Extra Inbox are
 * separate Polar products, both seat-based (1 Polar seat = 1 teammate or 1
 * mailbox). Priced the same for every workspace — including Early Access
 * accounts that keep Inbox itself unpaid. Product ids live in
 * `POLAR_PRODUCT_ADDON_*` environment variables, one per kind × interval.
 */

import {
  EXTRA_INBOX_PRICE_MONTHLY,
  EXTRA_INBOX_PRICE_YEARLY,
  EXTRA_SEAT_PRICE_MONTHLY,
  EXTRA_SEAT_PRICE_YEARLY,
} from "./plans";

export type AddOnKind = "seat" | "mailbox";

export type AddOnInterval = "month" | "year";

export const ADD_ON_KINDS: readonly AddOnKind[] = ["seat", "mailbox"];

/** Metadata key carrying the purchased quantity through Polar checkout. */
export const ADD_ON_QUANTITY_METADATA_KEY = "addonQuantity";

/** Metadata key naming which add-on a checkout is for. */
export const ADD_ON_KIND_METADATA_KEY = "addonKind";

/**
 * One checkout can add at most this many seats or mailboxes. A workspace that
 * needs more is a conversation, not a self-serve purchase, and the cap keeps a
 * tampered quantity from inflating an entitlement.
 */
export const MAX_ADD_ON_QUANTITY = 20;

export const ADD_ON_ENV_KEYS: Record<
  AddOnKind,
  Record<AddOnInterval, string>
> = {
  seat: {
    month: "POLAR_PRODUCT_ADDON_SEAT_MONTH_ID",
    year: "POLAR_PRODUCT_ADDON_SEAT_YEAR_ID",
  },
  mailbox: {
    month: "POLAR_PRODUCT_ADDON_INBOX_MONTH_ID",
    year: "POLAR_PRODUCT_ADDON_INBOX_YEAR_ID",
  },
};

/** Monthly price per unit. Yearly is the monthly equivalent when billed once. */
export const ADD_ON_PRICES: Record<AddOnKind, Record<AddOnInterval, number>> = {
  seat: {
    month: EXTRA_SEAT_PRICE_MONTHLY,
    year: EXTRA_SEAT_PRICE_YEARLY,
  },
  mailbox: {
    month: EXTRA_INBOX_PRICE_MONTHLY,
    year: EXTRA_INBOX_PRICE_YEARLY,
  },
};

export const ADD_ON_LABELS: Record<
  AddOnKind,
  { singular: string; plural: string }
> = {
  seat: { singular: "teammate seat", plural: "teammate seats" },
  mailbox: { singular: "mailbox", plural: "mailboxes" },
};

/** Receipt / paywall title. Not the Inbox plan name. */
export const ADD_ON_TITLES: Record<AddOnKind, string> = {
  seat: "Extra Seat",
  mailbox: "Extra Inbox",
};

/** Line under the title: "1 inbox upgrade" / "2 seats upgrade". */
export function formatAddOnUpgradeLabel(
  kind: AddOnKind,
  quantity: number,
): string {
  const count = clampAddOnQuantity(quantity);
  if (kind === "mailbox") {
    return count === 1 ? "1 inbox upgrade" : `${count} inboxes upgrade`;
  }
  return count === 1 ? "1 seat upgrade" : `${count} seats upgrade`;
}

export type AddOnProduct = {
  kind: AddOnKind;
  interval: AddOnInterval;
};

export function addOnEnvKey(kind: AddOnKind, interval: AddOnInterval): string {
  return ADD_ON_ENV_KEYS[kind][interval];
}

function readEnv(
  env: Record<string, string | undefined>,
  key: string,
): string | null {
  const value = env[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function addOnProductId(
  env: Record<string, string | undefined>,
  kind: AddOnKind,
  interval: AddOnInterval,
): string | null {
  return readEnv(env, addOnEnvKey(kind, interval));
}

/** Every configured add-on product, keyed by Polar product id. */
export function addOnProductsFromEnv(
  env: Record<string, string | undefined>,
): Map<string, AddOnProduct> {
  const products = new Map<string, AddOnProduct>();
  for (const kind of ADD_ON_KINDS) {
    for (const interval of ["month", "year"] as const) {
      const id = addOnProductId(env, kind, interval);
      if (id) {
        products.set(id, { kind, interval });
      }
    }
  }
  return products;
}

export function resolveAddOnProduct(
  productId: string | null | undefined,
  env: Record<string, string | undefined>,
): AddOnProduct | null {
  if (!productId) {
    return null;
  }
  return addOnProductsFromEnv(env).get(productId.trim()) ?? null;
}

export function resolveAddOnKindFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): AddOnKind | null {
  const raw = metadata?.[ADD_ON_KIND_METADATA_KEY];
  if (raw === "seat" || raw === "mailbox") {
    return raw;
  }
  return null;
}

/**
 * Polar product display name. "Inbox 3K" is the plan — Extra Inbox / Extra
 * Seat (and Polar aliases) are add-ons.
 */
export function resolveAddOnKindFromProductName(
  name: string | null | undefined,
): AddOnKind | null {
  if (!name) {
    return null;
  }
  const n = name.toLowerCase().replace(/\s+/g, " ").trim();
  if (/^inbox(\s+\d|\s+[0-9.]+[km])?$/.test(n)) {
    return null;
  }
  if (
    /\bextra\s*(member|seat)s?\b|\bteammate\s*seats?\b|\bseat\s*add[- ]?on\b|^seats?$/.test(
      n,
    )
  ) {
    return "seat";
  }
  if (
    /\bextra\s*(inbox|mailbox(es)?)\b|\b(inbox|mailbox)\s*add[- ]?on\b|^mailbox(es)?$/.test(
      n,
    )
  ) {
    return "mailbox";
  }
  return null;
}

/**
 * Identify Extra Inbox / Extra Member even when the Polar product UUID is
 * missing from `POLAR_PRODUCT_ADDON_*`. Checkout metadata is the source of
 * truth we set ourselves.
 */
export function resolveAddOnFromPurchase(input: {
  productId?: string | null;
  metadata?: Record<string, unknown> | null;
  productName?: string | null;
  amountCents?: number | null;
  env?: Record<string, string | undefined>;
}): AddOnProduct | null {
  const fromEnv = resolveAddOnProduct(input.productId, input.env ?? {});
  if (fromEnv) {
    return fromEnv;
  }
  const kind =
    resolveAddOnKindFromMetadata(input.metadata) ??
    resolveAddOnKindFromProductName(input.productName) ??
    inferAddOnKindFromAmountCents(input.amountCents);
  if (!kind) {
    return null;
  }
  return { kind, interval: "month" };
}

/**
 * Quantity for an add-on subscription. Polar reports one subscription per
 * purchase without a quantity of its own, so the count rides in checkout
 * metadata that we set — hence the clamp, since metadata comes back over the
 * wire.
 */
export function addOnQuantityFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): number {
  const raw = metadata?.[ADD_ON_QUANTITY_METADATA_KEY];
  const parsed =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return clampAddOnQuantity(parsed);
}

/**
 * How many units an add-on subscription entitles. Extra Member and Extra
 * Inbox are seat-based on Polar — trust `seats`. Older unit-priced Extra
 * Inbox rows may still send `units`. Metadata is the last fallback.
 */
export function addOnQuantityFromSubscription(subscription: {
  seats?: number | null;
  units?: number | null;
  metadata?: Record<string, unknown> | null;
}): number {
  const seats = subscription.seats;
  if (typeof seats === "number" && Number.isFinite(seats) && seats >= 1) {
    return clampAddOnQuantity(seats);
  }
  const units = subscription.units;
  if (typeof units === "number" && Number.isFinite(units) && units >= 1) {
    return clampAddOnQuantity(units);
  }
  return addOnQuantityFromMetadata(subscription.metadata ?? null);
}

export function clampAddOnQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }
  return Math.min(MAX_ADD_ON_QUANTITY, Math.max(1, Math.floor(quantity)));
}

/**
 * Units still missing on the Humaner ledger after Polar/checkout sync.
 * A successful Extra Inbox / Extra Seat payment must raise extras by the
 * purchased count — `Math.max` on an existing row is not a grant.
 */
export function missingAddOnGrant(
  extrasBefore: number,
  extrasAfterSync: number,
  purchasedQuantity: number,
): number {
  const before = Math.max(0, extrasBefore);
  const after = Math.max(0, extrasAfterSync);
  const purchased = clampAddOnQuantity(purchasedQuantity);
  return Math.max(0, before + purchased - after);
}

/**
 * Polar opens a new Extra Inbox / Extra Seat subscription per checkout
 * instead of raising `seats` on the first one. A `checkout:{id}` row is a
 * paid grant Polar has not absorbed yet — fold it only into a new Polar id,
 * or when Polar's count already covers the local kind total. Folding a
 * stale seats=1 event into the first Extra Inbox row drops every later buy.
 */
export function shouldFoldCheckoutPlaceholder(input: {
  polarSubscriptionAlreadyOnLedger: boolean;
  polarQuantity: number;
  localKindTotal: number;
}): boolean {
  if (!input.polarSubscriptionAlreadyOnLedger) {
    return true;
  }
  return Math.max(0, input.polarQuantity) >= Math.max(0, input.localKindTotal);
}

export function formatAddOnCount(kind: AddOnKind, count: number): string {
  const labels = ADD_ON_LABELS[kind];
  return `${count} ${count === 1 ? labels.singular : labels.plural}`;
}

/** Monthly total for a quantity at the given interval. */
export function addOnMonthlyPrice(
  kind: AddOnKind,
  interval: AddOnInterval,
  quantity: number,
): number {
  return ADD_ON_PRICES[kind][interval] * clampAddOnQuantity(quantity);
}

export function addOnCheckoutAmountCents(
  kind: AddOnKind,
  interval: AddOnInterval,
  quantity: number,
): number {
  const monthly = ADD_ON_PRICES[kind][interval];
  const periods = interval === "year" ? 12 : 1;
  return Math.round(monthly * periods * clampAddOnQuantity(quantity) * 100);
}

/**
 * Polar often labels Extra Inbox with the Inbox plan name. The catalog
 * amount ($7 inbox / $12 seat) is unique to these add-ons.
 */
export function inferAddOnKindFromAmountCents(
  cents: number | null | undefined,
): AddOnKind | null {
  if (typeof cents !== "number" || !Number.isFinite(cents) || cents <= 0) {
    return null;
  }
  const amount = Math.round(cents);
  for (const kind of ADD_ON_KINDS) {
    for (const interval of ["month", "year"] as const) {
      for (let n = 1; n <= MAX_ADD_ON_QUANTITY; n++) {
        if (amount === addOnCheckoutAmountCents(kind, interval, n)) {
          return kind;
        }
      }
    }
  }
  return null;
}

export function inferAddOnFromTotals(
  totals: {
    unitPriceCents?: number | null;
    subtotalCents?: number | null;
    amountCents?: number | null;
  } | null,
): AddOnKind | null {
  if (!totals) {
    return null;
  }
  return (
    inferAddOnKindFromAmountCents(totals.unitPriceCents) ??
    inferAddOnKindFromAmountCents(totals.subtotalCents) ??
    inferAddOnKindFromAmountCents(totals.amountCents)
  );
}
