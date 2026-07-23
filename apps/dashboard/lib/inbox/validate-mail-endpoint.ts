import 'server-only';

import type { LookupAddress } from 'node:dns';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { ValidationError } from '@/lib/validation/exceptions';

const ALLOWED_IMAP_PORTS = new Set([993]);
const ALLOWED_SMTP_PORTS = new Set([465, 587]);
const OAUTH_ONLY_HOST_SUFFIXES = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'office365.com'
] as const;

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.slice('::ffff:'.length));
  }

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
  );
}

function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return !isPrivateIpv4(address);
  if (version === 6) return !isPrivateIpv6(address);
  return false;
}

function normalizeHostname(host: string): string {
  const normalized = host.trim().toLowerCase().replace(/\.$/, '');
  if (
    !normalized ||
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.includes('/') ||
    normalized.includes('\\') ||
    normalized.includes('@') ||
    normalized.includes(':')
  ) {
    throw new ValidationError('Enter a valid public mail server hostname.');
  }
  if (
    OAUTH_ONLY_HOST_SUFFIXES.some(
      (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`)
    )
  ) {
    throw new ValidationError(
      'Use the provider OAuth connection for Google or Microsoft mail.'
    );
  }
  return normalized;
}

export type ValidatedMailEndpoint = {
  hostname: string;
  address: string;
};

async function resolvePublicHostname(
  host: string
): Promise<ValidatedMailEndpoint> {
  const hostname = normalizeHostname(host);

  if (isIP(hostname)) {
    throw new ValidationError(
      'Use a public mail server hostname instead of an IP address.'
    );
  }

  let addresses: LookupAddress[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ValidationError('Could not resolve the mail server hostname.');
  }

  if (
    addresses.length === 0 ||
    addresses.some((result) => !isPublicAddress(result.address))
  ) {
    throw new ValidationError(
      'Mail servers must resolve only to public internet addresses.'
    );
  }

  return { hostname, address: addresses[0].address };
}

export async function validateMailEndpoints(input: {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
}): Promise<{
  imap: ValidatedMailEndpoint;
  smtp: ValidatedMailEndpoint;
}> {
  if (!ALLOWED_IMAP_PORTS.has(input.imapPort)) {
    throw new ValidationError('IMAP port must be 993 with TLS.');
  }
  if (!ALLOWED_SMTP_PORTS.has(input.smtpPort)) {
    throw new ValidationError('SMTP port must be 465 or 587.');
  }

  const [imap, smtp] = await Promise.all([
    resolvePublicHostname(input.imapHost),
    resolvePublicHostname(input.smtpHost)
  ]);

  return { imap, smtp };
}
