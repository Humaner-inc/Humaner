import 'server-only';

/**
 * Self-Host (OSS) twin of `lib/billing/message-usage.ts`.
 *
 * Self-Host is unmetered — no monthly message quota, no Upstash counter, no
 * Polar overage. Every call reports zero usage and an unmetered reservation, so
 * analytics, notifications and any quota check treat the workspace as unlimited.
 * josh renames it onto `message-usage.ts`.
 */

export function invalidateMessagesUsedCache(_organizationId: string): void {
  // No usage cache in Self-Host.
}

export async function getMessagesUsedThisMonth(
  _organizationId: string,
  _knownTier?: string
): Promise<number> {
  return 0;
}

export type MessageQuotaReservation = {
  allowed: boolean;
  release: () => Promise<void>;
};

export const UNMETERED_MESSAGE_QUOTA: MessageQuotaReservation = {
  allowed: true,
  release: async () => {}
};

export async function reserveMessageQuotaSlot(_input: {
  organizationId: string;
  knownTier?: string;
  limit: number;
}): Promise<MessageQuotaReservation> {
  return UNMETERED_MESSAGE_QUOTA;
}
