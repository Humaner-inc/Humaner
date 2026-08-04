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

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(normalizeWebsiteInput(value));
  } catch {
    return null;
  }
}

export function isDocsWebsiteUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }
  const url = tryParseUrl(value);
  if (!url) {
    return /docs\./i.test(value);
  }
  return (
    url.hostname.startsWith('docs.') ||
    url.pathname === '/docs' ||
    url.pathname.startsWith('/docs/')
  );
}

/** Recover the business site when a docs URL was stored as `website`. */
export function businessWebsiteFromDocsUrl(
  docsUrl: string | null | undefined
): string | null {
  if (!docsUrl?.trim()) {
    return null;
  }
  const url = tryParseUrl(docsUrl);
  if (!url) {
    return null;
  }
  if (url.hostname.startsWith('docs.')) {
    return `${url.protocol}//${url.hostname.slice('docs.'.length)}/`;
  }
  return `${url.origin}/`;
}

/**
 * Business website for display/edit — prefers the onboarding site URL, never
 * the docs page (`docsUrl` / docs subdomain / `/docs` path).
 */
export function resolveBusinessWebsite(
  website: string | null | undefined,
  docsUrl?: string | null | undefined
): string | undefined {
  const trimmed = website?.trim();
  if (!trimmed) {
    return undefined;
  }

  const normalizedWebsite = normalizeWebsiteInput(trimmed);
  const normalizedDocs = docsUrl?.trim()
    ? normalizeWebsiteInput(docsUrl.trim())
    : null;

  if (
    isDocsWebsiteUrl(normalizedWebsite) ||
    (normalizedDocs &&
      tryParseUrl(normalizedWebsite)?.href ===
        tryParseUrl(normalizedDocs)?.href)
  ) {
    return (
      businessWebsiteFromDocsUrl(normalizedDocs ?? normalizedWebsite) ??
      undefined
    );
  }

  return normalizedWebsite;
}
