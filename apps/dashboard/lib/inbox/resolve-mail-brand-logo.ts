import { getLogoUrl, toHostname } from '@/lib/logo';

const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'stripe.com',
  'paypal.com',
  'mailgun.org',
  'sendgrid.net',
  'amazonses.com',
  'postmarkapp.com'
]);

export function domainFromEmail(
  email: string | null | undefined
): string | null {
  const host = email?.split('@')[1]?.trim().toLowerCase();
  if (!host || GENERIC_EMAIL_DOMAINS.has(host)) return null;
  return host.replace(/^www\./, '');
}

export function resolveMailBrandLogoUrl(
  website: string | null | undefined,
  email: string | null | undefined
): string | null {
  const domain =
    (website ? toHostname(website) : null) || domainFromEmail(email);
  if (!domain) return null;
  return getLogoUrl(domain, 128, false);
}
