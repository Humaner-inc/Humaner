/**
 * `AUTH_SECRET` is the key behind session encryption, TOTP secrets, and the
 * email OTP hash. Several of those call sites interpolate it into a string, so
 * a missing value does not throw — it silently produces the literal
 * `"undefined"`, making every OTP hash in the deployment predictable.
 *
 * Reading it through this module makes that impossible.
 */

/** Short enough to accept existing secrets, long enough to reject placeholders. */
const MIN_LENGTH = 32;

const PLACEHOLDERS = new Set([
  'change-me-to-a-long-random-string',
  'generate-with-openssl-rand-base64-32',
  'generate-a-long-random-string'
]);

function validate(secret: string | undefined): string {
  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and set it before starting the server.'
    );
  }

  if (PLACEHOLDERS.has(secret)) {
    throw new Error(
      'AUTH_SECRET is still set to a placeholder value. Generate a real one with `openssl rand -base64 32`.'
    );
  }

  if (secret.length < MIN_LENGTH) {
    throw new Error(
      `AUTH_SECRET must be at least ${MIN_LENGTH} characters. Generate one with \`openssl rand -base64 32\`.`
    );
  }

  return secret;
}

export function requireAuthSecret(): string {
  return validate(process.env.AUTH_SECRET);
}

/**
 * Fail the process at boot rather than at the first sign-in attempt. Called
 * from `instrumentation.ts`.
 */
export function assertAuthSecretConfigured(): void {
  validate(process.env.AUTH_SECRET);
}
