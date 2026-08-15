import 'server-only';

import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * DNS-aware SSRF guard for user-supplied URLs.
 *
 * `lib/urls/is-public-http-url` is a pure string check so it can run in client
 * Zod schemas; it cannot see that `evil.example.com` resolves to 169.254.169.254.
 * Anything that actually opens a socket must use this instead, and must re-check
 * every redirect hop — see `fetch-public-url`.
 *
 * Ported from `apps/into-markdown/src/public-url.ts`; keep the two in sync.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
  'metadata'
]);

const DNS_TTL_MS = 30_000;
const dnsCache = new Map<string, { ips: string[]; expires: number }>();

function expandIpv6(ip: string): string[] | null {
  const lower = ip.toLowerCase();
  if (lower.includes('.')) return null; // mapped form handled separately
  const [head, tail] = lower.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  if (lower.includes('::')) {
    const missing = 8 - headParts.length - tailParts.length;
    if (missing < 0) return null;
    return [...headParts, ...Array(missing).fill('0'), ...tailParts].map((h) =>
      h.padStart(4, '0')
    );
  }
  const parts = lower.split(':');
  if (parts.length !== 8) return null;
  return parts.map((h) => h.padStart(4, '0'));
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    n = (n << 8) | value;
  }
  return n >>> 0;
}

function inCidr(ipInt: number, base: string, bits: number): boolean {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

/** True for loopback, RFC1918, link-local, CGNAT, multicast, etc. */
export function isNonPublicIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const n = ipv4ToInt(ip);
    if (n === null) return true;
    if (inCidr(n, '0.0.0.0', 8)) return true;
    if (inCidr(n, '10.0.0.0', 8)) return true;
    if (inCidr(n, '127.0.0.0', 8)) return true;
    if (inCidr(n, '169.254.0.0', 16)) return true;
    if (inCidr(n, '172.16.0.0', 12)) return true;
    if (inCidr(n, '192.168.0.0', 16)) return true;
    if (inCidr(n, '100.64.0.0', 10)) return true;
    if (inCidr(n, '192.0.0.0', 24)) return true;
    if (inCidr(n, '192.0.2.0', 24)) return true;
    if (inCidr(n, '198.51.100.0', 24)) return true;
    if (inCidr(n, '203.0.113.0', 24)) return true;
    if (inCidr(n, '224.0.0.0', 4)) return true;
    if (inCidr(n, '240.0.0.0', 4)) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::' || lower === '::1') return true;

    // IPv4-mapped ::ffff:x.x.x.x or ::ffff:7f00:1
    const mappedDot = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappedDot?.[1]) return isNonPublicIp(mappedDot[1]);
    const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mappedHex?.[1] && mappedHex[2]) {
      const hi = Number.parseInt(mappedHex[1], 16);
      const lo = Number.parseInt(mappedHex[2], 16);
      return isNonPublicIp(
        `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`
      );
    }

    const hextets = expandIpv6(lower);
    if (!hextets?.[0] || !hextets[1]) return true;
    const first = Number.parseInt(hextets[0], 16);
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    if (first === 0x2001 && Number.parseInt(hextets[1], 16) === 0xdb8) {
      return true; // 2001:db8::/32 documentation
    }

    return false;
  }

  return true;
}

async function resolveHostIps(hostname: string): Promise<string[]> {
  const key = hostname.toLowerCase();
  const cached = dnsCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.ips;
  }

  const results = await dns.lookup(key, { all: true, verbatim: true });
  const ips = results.map((result) => result.address);
  dnsCache.set(key, { ips, expires: Date.now() + DNS_TTL_MS });
  return ips;
}

export type PublicUrlOptions = {
  /** When set, also require the same registrable host (www ↔ apex). */
  sameSiteAs?: URL;
};

/**
 * Ensure a URL is a public http(s) target — not localhost, a private IP,
 * link-local, or cloud metadata. Resolves DNS and checks every address.
 */
export async function assertPublicHttpUrl(
  input: string | URL,
  options?: PublicUrlOptions
): Promise<URL> {
  let url: URL;
  try {
    url = input instanceof URL ? new URL(input.href) : new URL(input);
  } catch {
    throw new Error('Invalid URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported.');
  }

  if (url.username || url.password) {
    throw new Error('URLs with credentials are not allowed.');
  }

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host) {
    throw new Error('Invalid URL host.');
  }

  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new Error('That host is not allowed.');
  }

  if (net.isIP(host)) {
    if (isNonPublicIp(host)) {
      throw new Error('Private or local network addresses are not allowed.');
    }
  } else {
    let ips: string[];
    try {
      ips = await resolveHostIps(host);
    } catch {
      throw new Error('Could not resolve host.');
    }
    if (ips.length === 0) {
      throw new Error('Could not resolve host.');
    }
    for (const ip of ips) {
      if (isNonPublicIp(ip)) {
        throw new Error('Private or local network addresses are not allowed.');
      }
    }
  }

  if (options?.sameSiteAs) {
    const a = host.replace(/^www\./, '');
    const b = options.sameSiteAs.hostname
      .replace(/^\[|\]$/g, '')
      .toLowerCase()
      .replace(/^www\./, '');
    if (a !== b) {
      throw new Error('Off-site redirects are not followed.');
    }
  }

  return url;
}

export async function isPublicHttpUrlWithDns(
  input: string | URL
): Promise<boolean> {
  try {
    await assertPublicHttpUrl(input);
    return true;
  } catch {
    return false;
  }
}
