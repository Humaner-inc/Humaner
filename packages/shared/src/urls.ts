const DEFAULT_LANDING_URL = 'http://localhost:3000';
const DEFAULT_APP_URL = 'http://localhost:3001';

export function getLandingUrl(): string {
  return process.env.NEXT_PUBLIC_LANDING_URL ?? DEFAULT_LANDING_URL;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    DEFAULT_APP_URL
  );
}

export function getDashboardSignUpUrl(): string {
  return `${getAppUrl()}/auth/signup`;
}

export function getDashboardLoginUrl(): string {
  return `${getAppUrl()}/auth/login`;
}

export function getPricingUrl(): string {
  return `${getLandingUrl()}/pricing`;
}

export function getBookDemoUrl(): string {
  return 'mailto:hello@humaner.io?subject=Book%20a%20demo';
}

export function getPrivacyUrl(): string {
  return `${getLandingUrl()}/privacy`;
}

export function getTermsUrl(): string {
  return `${getLandingUrl()}/terms`;
}

export function getSecurityUrl(): string {
  return `${getLandingUrl()}/security`;
}
