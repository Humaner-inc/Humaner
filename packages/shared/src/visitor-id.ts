/** Max length matches `Conversation.visitorId` (`VarChar(255)`). */
export const VISITOR_ID_MAX_LENGTH = 255;

/**
 * Normalize a developer-provided visitor ID (hashed user id from their auth).
 * Returns `null` when missing or invalid.
 */
export function normalizeVisitorId(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > VISITOR_ID_MAX_LENGTH) {
    return null;
  }
  return trimmed;
}

export function isValidVisitorId(
  value: string | null | undefined,
): value is string {
  return normalizeVisitorId(value) !== null;
}
