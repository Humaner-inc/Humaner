import { afterEach, describe, expect, it } from 'vitest';

import {
  assertAuthSecretConfigured,
  requireAuthSecret
} from '@/lib/auth/auth-secret';

const VALID = 'x'.repeat(32);

describe('requireAuthSecret', () => {
  afterEach(() => {
    delete process.env.AUTH_SECRET;
  });

  it('returns a configured secret', () => {
    process.env.AUTH_SECRET = VALID;
    expect(requireAuthSecret()).toBe(VALID);
  });

  // Unset, this used to stringify into OTP hashes as "undefined", making every verification code in the deployment predictable.
  it('throws when unset instead of yielding a usable value', () => {
    expect(() => requireAuthSecret()).toThrow('AUTH_SECRET is not set');
  });

  it('rejects documented placeholder values', () => {
    process.env.AUTH_SECRET = 'change-me-to-a-long-random-string';
    expect(() => requireAuthSecret()).toThrow('placeholder');
  });

  it('rejects secrets that are too short to be random', () => {
    process.env.AUTH_SECRET = 'short';
    expect(() => requireAuthSecret()).toThrow('at least 32');
  });

  it('assertAuthSecretConfigured passes only for a real secret', () => {
    expect(() => assertAuthSecretConfigured()).toThrow();
    process.env.AUTH_SECRET = VALID;
    expect(() => assertAuthSecretConfigured()).not.toThrow();
  });
});
