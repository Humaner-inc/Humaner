import { describe, expect, it } from 'vitest';

import { assertPublicHttpUrl, isNonPublicIp } from '@/lib/security/public-url';

describe('isNonPublicIp', () => {
  it('flags loopback, private, link-local, and CGNAT ranges', () => {
    for (const ip of [
      '127.0.0.1',
      '10.1.2.3',
      '172.16.0.1',
      '192.168.1.1',
      '169.254.169.254', // cloud metadata
      '100.64.0.1',
      '0.0.0.0'
    ]) {
      expect(isNonPublicIp(ip), ip).toBe(true);
    }
  });

  it('flags IPv6 loopback, unique-local, and link-local', () => {
    for (const ip of ['::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isNonPublicIp(ip), ip).toBe(true);
    }
  });

  // The hex form of an IPv4-mapped address is the usual way this check is
  // bypassed: ::ffff:a9fe:a9fe is 169.254.169.254.
  it('resolves hex-encoded IPv4-mapped addresses before checking', () => {
    expect(isNonPublicIp('::ffff:a9fe:a9fe')).toBe(true);
    expect(isNonPublicIp('::ffff:7f00:1')).toBe(true);
  });

  it('allows public addresses', () => {
    expect(isNonPublicIp('8.8.8.8')).toBe(false);
    expect(isNonPublicIp('2606:4700:4700::1111')).toBe(false);
  });

  it('strips IPv6 zone IDs before classifying', () => {
    expect(isNonPublicIp('fe80::1%12')).toBe(true);
    expect(isNonPublicIp('2606:4700:4700::1111%eth0')).toBe(false);
  });

  it('treats anything unparseable as non-public', () => {
    expect(isNonPublicIp('not-an-ip')).toBe(true);
    expect(isNonPublicIp('')).toBe(true);
  });
});

describe('assertPublicHttpUrl', () => {
  it('rejects non-http schemes', async () => {
    await expect(assertPublicHttpUrl('file:///etc/passwd')).rejects.toThrow();
    await expect(assertPublicHttpUrl('gopher://example.com')).rejects.toThrow();
  });

  it('rejects embedded credentials', async () => {
    await expect(
      assertPublicHttpUrl('https://user:pass@example.com')
    ).rejects.toThrow('credentials');
  });

  it('rejects loopback and internal hostnames without touching DNS', async () => {
    await expect(
      assertPublicHttpUrl('http://localhost:3000')
    ).rejects.toThrow();
    await expect(assertPublicHttpUrl('http://db.internal')).rejects.toThrow();
    await expect(
      assertPublicHttpUrl('http://metadata.google.internal')
    ).rejects.toThrow();
  });

  it('rejects private IP literals', async () => {
    await expect(
      assertPublicHttpUrl('http://169.254.169.254/latest/meta-data/')
    ).rejects.toThrow('Private or local');
    await expect(assertPublicHttpUrl('http://[::1]/')).rejects.toThrow(
      'Private or local'
    );
  });

  it('enforces same-site when asked, so redirects cannot leave the origin', async () => {
    await expect(
      assertPublicHttpUrl('https://93.184.216.34/path', {
        sameSiteAs: new URL('https://8.8.8.8')
      })
    ).rejects.toThrow('Off-site');
  });

  it('treats www and apex as the same site', async () => {
    await expect(
      assertPublicHttpUrl('https://www.example.com/docs', {
        sameSiteAs: new URL('https://example.com')
      })
    ).resolves.toBeInstanceOf(URL);
    await expect(
      assertPublicHttpUrl('https://example.com/docs', {
        sameSiteAs: new URL('https://www.example.com')
      })
    ).resolves.toBeInstanceOf(URL);
  });
});
