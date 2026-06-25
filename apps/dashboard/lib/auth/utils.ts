// Taken from next-auth/packages/core/src/lib/utils/web.ts

/** Web compatible method to create a hash, using SHA256 */
export async function createHash(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toString();
}

/** Web compatible method to create a random string of a given length */
export function randomString(size: number): string {
  const i2hex = (i: number) => ('0' + i.toString(16)).slice(-2);
  const r = (a: string, i: number): string => a + i2hex(i);
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes).reduce(r, '');
}

/** User is verified when emailVerified is set (timestamp of verification). */
export function isEmailVerified(
  emailVerified: Date | null | undefined
): boolean {
  return emailVerified != null;
}
