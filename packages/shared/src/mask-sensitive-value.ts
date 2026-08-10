export const SENSITIVE_MASK_CHAR = "\u25AA";

//Replace alphanumeric characters with mask blocks — preserves punctuation and spacing.
export function maskSensitiveChars(value: string): string {
  return value.replace(/[a-zA-Z0-9]/g, SENSITIVE_MASK_CHAR);
}

export function repeatSensitiveMask(count: number): string {
  return SENSITIVE_MASK_CHAR.repeat(count);
}
