const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.fr',
  'hotmail.com',
  'hotmail.fr',
  'outlook.com',
  'outlook.fr',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'msn.com',
  'ymail.com',
  'gmx.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'fastmail.com'
]);

export function inferWebsiteUrlFromEmail(
  email: string | null | undefined
): string | null {
  if (!email?.includes('@')) {
    return null;
  }

  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain || PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return null;
  }

  return `https://${domain}`;
}

export function normalizeWebsiteInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function inferDocsUrlFromWebsite(
  website: string | null | undefined
): string | null {
  const normalized = normalizeWebsiteInput(website ?? '');
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    return `${url.origin}/docs`;
  } catch {
    return null;
  }
}
