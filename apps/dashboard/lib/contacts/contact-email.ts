const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Bare lowercase mailbox, or null when the value is not an email. */
export function normalizeContactEmail(value: string): string | null {
  const trimmed = value.trim();
  const bracketed = trimmed.match(/<([^<>]+)>/);
  const email = (bracketed?.[1] ?? trimmed).trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

export function isEmailAddress(value: string): boolean {
  return normalizeContactEmail(value) === value.trim().toLowerCase();
}

export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  const words = local.replace(/[._+-]+/g, ' ').trim();
  if (!words) return email.slice(0, 128);
  return words.replace(/\b\w/g, (char) => char.toUpperCase()).slice(0, 128);
}

/** Second-level suffixes where the company sits one label further left. */
const MULTI_PART_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'com.br',
  'com.mx',
  'co.za',
  'com.sg',
  'co.in',
  'co.jp',
  'com.tr',
  'co.kr',
  'com.ar',
  'com.hk'
]);

function domainLabels(email: string): string[] | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  const labels = domain.split('.').filter(Boolean);
  return labels.length < 2 ? null : labels;
}

/** Index of the company label, immediately before the public suffix. */
function companyLabelIndex(labels: string[]): number {
  const suffix = labels.slice(-2).join('.');
  return MULTI_PART_SUFFIXES.has(suffix)
    ? labels.length - 3
    : labels.length - 2;
}

/**
 * Registrable domain for the company behind an address.
 * `team@mail.cursor.com` is `cursor.com`. `sales@shop.co.uk` is `shop.co.uk`.
 */
export function companyDomainFromEmail(email: string): string | null {
  const labels = domainLabels(email);
  if (!labels) return null;
  const index = companyLabelIndex(labels);
  if (index < 0 || !labels[index]) return null;
  return labels.slice(index).join('.');
}

/**
 * Company is the domain label immediately before the public suffix.
 * `team@mail.cursor.com` is Cursor. `dev@humaner.io` is Humaner.
 */
export function companyFromEmail(email: string): string | null {
  const labels = domainLabels(email);
  if (!labels) return null;
  const company = labels[companyLabelIndex(labels)];
  if (!company || company.length < 2) return null;

  return company
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
