import { isTrustedNavigationUrl } from '@humaner/shared/urls';
import { describe, expect, it } from 'vitest';

describe('isTrustedNavigationUrl', () => {
  it('allows same-origin paths and blocks protocol-relative URLs', () => {
    expect(isTrustedNavigationUrl('/auth/login')).toBe(true);
    expect(isTrustedNavigationUrl('//evil.example/phish')).toBe(false);
  });

  it('allows OAuth and Polar hosts over https only', () => {
    expect(
      isTrustedNavigationUrl(
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=x'
      )
    ).toBe(true);
    expect(
      isTrustedNavigationUrl('https://sandbox.polar.sh/checkout/abc')
    ).toBe(true);
    expect(isTrustedNavigationUrl('javascript:alert(1)')).toBe(false);
    expect(isTrustedNavigationUrl('https://evil.example/oauth')).toBe(false);
  });

  it('allows mailto with subject/body only', () => {
    expect(
      isTrustedNavigationUrl('mailto:support@humaner.io?subject=Help')
    ).toBe(true);
    expect(
      isTrustedNavigationUrl('mailto:support@humaner.io?bcc=attacker@evil.test')
    ).toBe(false);
  });
});
