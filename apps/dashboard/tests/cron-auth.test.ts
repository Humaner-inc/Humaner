import type { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';

import { verifyCronSecret } from '@/lib/security/verify-cron-secret';

function requestWithAuth(header: string | null): NextRequest {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization' ? header : null
    }
  } as unknown as NextRequest;
}

describe('verifyCronSecret', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('accepts the configured secret', () => {
    process.env.CRON_SECRET = 'super-secret-value';
    expect(verifyCronSecret(requestWithAuth('Bearer super-secret-value'))).toBe(
      true
    );
  });

  it('rejects a wrong secret of the same length', () => {
    process.env.CRON_SECRET = 'super-secret-value';
    expect(verifyCronSecret(requestWithAuth('Bearer super-secret-valuX'))).toBe(
      false
    );
  });

  it('rejects a missing authorization header', () => {
    process.env.CRON_SECRET = 'super-secret-value';
    expect(verifyCronSecret(requestWithAuth(null))).toBe(false);
  });

  it('rejects the bare secret without the Bearer scheme', () => {
    process.env.CRON_SECRET = 'super-secret-value';
    expect(verifyCronSecret(requestWithAuth('super-secret-value'))).toBe(false);
  });

  // Otherwise an unconfigured deployment would expose every cron route.
  it('denies everything when CRON_SECRET is unset', () => {
    expect(verifyCronSecret(requestWithAuth('Bearer anything'))).toBe(false);
    expect(verifyCronSecret(requestWithAuth(''))).toBe(false);
  });
});
