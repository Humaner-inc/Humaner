/** Circular bullet — matches password `disc` masking in the dashboard. */
export const SENSITIVE_MASK_CHAR = "\u2022";

/** Default visible prefix when masking Humaner API keys (`hu_` + start of secret). */
export const API_KEY_MASK_VISIBLE_CHARS = 10;

//Replace alphanumeric characters with mask blocks — preserves punctuation and spacing.
export function maskSensitiveChars(value: string): string {
  return value.replace(/[a-zA-Z0-9]/g, SENSITIVE_MASK_CHAR);
}

/** Mask an API key but keep the recognizable prefix visible (e.g. `hu_1b1a57••••`). */
export function maskApiKey(
  value: string,
  visibleChars = API_KEY_MASK_VISIBLE_CHARS,
): string {
  if (value.length <= visibleChars) {
    return value;
  }
  const head = value.slice(0, visibleChars);
  const tail = value
    .slice(visibleChars)
    .replace(/[a-zA-Z0-9]/g, SENSITIVE_MASK_CHAR);
  return head + tail;
}

export function repeatSensitiveMask(count: number): string {
  return SENSITIVE_MASK_CHAR.repeat(count);
}
