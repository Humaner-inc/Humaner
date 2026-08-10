/** Pure hostname checks — safe for client Zod schemas. DNS SSRF checks stay server-side. */

function isPrivateOrLocalIpv4(host: string): boolean {
  const parts = host.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

/** True when the URL is http(s) and not aimed at private/local hosts. */
export function isPublicHttpUrl(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80:') ||
    host.includes(':') // block raw IPv6 literals for metadata/ULA
  ) {
    return false;
  }

  if (isPrivateOrLocalIpv4(host)) {
    return false;
  }

  return true;
}

export function parsePublicHttpUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return isPublicHttpUrl(url) ? url : null;
  } catch {
    return null;
  }
}
