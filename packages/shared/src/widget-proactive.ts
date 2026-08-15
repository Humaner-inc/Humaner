export const MAX_PROACTIVE_MESSAGE_LENGTH = 280;
export const DEFAULT_PROACTIVE_DELAY_SECONDS = 8;
export const MIN_PROACTIVE_DELAY_SECONDS = 0;
export const MAX_PROACTIVE_DELAY_SECONDS = 120;
export const PROACTIVE_MESSAGE_TTL_SECONDS = 60 * 60 * 24;

export const WIDGET_TEASER_FRAME_WIDTH = 340;
export const WIDGET_TEASER_FRAME_HEIGHT = 170;

export function clampProactiveDelaySeconds(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return DEFAULT_PROACTIVE_DELAY_SECONDS;
  }
  return Math.min(
    MAX_PROACTIVE_DELAY_SECONDS,
    Math.max(MIN_PROACTIVE_DELAY_SECONDS, Math.round(parsed)),
  );
}

export function parseProactiveMessage(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, MAX_PROACTIVE_MESSAGE_LENGTH);
}

export function proactiveSeenStorageKey(publicId: string): string {
  return `humaner_proactive_seen_${publicId}`;
}

export function hashProactiveMessage(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i += 1) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}
