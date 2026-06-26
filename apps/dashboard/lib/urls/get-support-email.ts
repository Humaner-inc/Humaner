export function getSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@humaner.io';
}

export function getSupportMailtoUrl(subject?: string): string {
  const email = getSupportEmail();
  if (!subject) {
    return `mailto:${email}`;
  }
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
