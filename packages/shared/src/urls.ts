const DEFAULT_LANDING_URL = "http://localhost:3000";
const DEFAULT_APP_URL = "http://localhost:3001";
const DEFAULT_INTO_MARKDOWN_URL = "https://markdown.humaner.io";

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

/** Public id of the platform Humaner assistant (org guide, product help). */
export function getHumanerAgentPublicId(): string | undefined {
  const id =
    process.env.NEXT_PUBLIC_HUMANER_AGENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_DEMO_AGENT_ID?.trim();
  return id || undefined;
}

/** Black mark — light / cream surfaces. */
export const HUMANER_LOGO_LIGHT_PATH = "/logo-black.png";
/** White mark — dark surfaces. */
export const HUMANER_LOGO_DARK_PATH = "/logo-white.png";
/** Brandmark for white / cream chrome (emails, light widgets, light sidebar). */
export const HUMANER_BRANDMARK_LIGHT_PATH = "/brand/brandmark-white.svg";
/** Brandmark for black / dark chrome (dark widgets, dark sidebar). */
export const HUMANER_BRANDMARK_DARK_PATH = "/brand/brandmark-dark.svg";

/** PNG logo for transactional email (SVG is blocked by most clients). */
export const EMAIL_LOGO_PATH = "/humaner-email.png";

/** X / Twitter mark for transactional email (same glyph as landing footer). */
export const EMAIL_X_ICON_PATH = "/x-email.png";

export function getEmailLogoUrl(): string {
  return `${getAppUrl()}${EMAIL_LOGO_PATH}`;
}

export function getEmailXIconUrl(): string {
  return `${getAppUrl()}${EMAIL_X_ICON_PATH}`;
}

export function getDashboardSignUpUrl(options?: {
  plan?: string;
  messages?: number;
}): string {
  const base = `${getAppUrl()}/auth/signup`;
  if (!options?.plan) return base;
  const params = new URLSearchParams({ plan: options.plan });
  if (
    options.messages != null &&
    Number.isFinite(options.messages) &&
    options.messages > 0
  ) {
    params.set("messages", String(Math.floor(options.messages)));
  }
  return `${base}?${params.toString()}`;
}

export function getDashboardLoginUrl(): string {
  return `${getAppUrl()}/auth/login`;
}

/** Default authenticated landing in the dashboard (org overview). */
export function getDashboardHomeUrl(): string {
  return `${getAppUrl()}/organization`;
}

export function getDashboardOnboardingUrl(): string {
  return `${getAppUrl()}/onboarding`;
}

/** Public session probe used by the marketing site navbar. */
export function getDashboardNavSessionUrl(): string {
  return `${getAppUrl()}/api/public/nav-session`;
}

export function getPricingUrl(): string {
  return `${getLandingUrl()}/pricing`;
}

export function getBookDemoUrl(): string {
  return "https://cal.com/alex-neyret/20min";
}

export function getPrivacyUrl(): string {
  return `${getLandingUrl()}/privacy`;
}

export function getTermsUrl(): string {
  return `${getLandingUrl()}/terms`;
}

export function getDpaUrl(): string {
  return `${getLandingUrl()}/dpa`;
}

export function getSecurityUrl(): string {
  return `${getLandingUrl()}/security`;
}

export function getContactUrl(): string {
  return `${getLandingUrl()}/contact`;
}

export function getFreeToolsUrl(): string {
  return `${getLandingUrl()}/free-tools`;
}

export function getDocsUrl(): string {
  return process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.humaner.io";
}

export function getIntoMarkdownUrl(): string {
  if (process.env.NEXT_PUBLIC_INTO_MARKDOWN_URL) {
    return process.env.NEXT_PUBLIC_INTO_MARKDOWN_URL;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3005";
  }
  return DEFAULT_INTO_MARKDOWN_URL;
}

export function getGithubUrl(): string {
  return "https://github.com/Humaner-inc";
}

export function getXUrl(): string {
  return "https://x.com/usehumaner";
}

/** Prefilled compose — the user can edit or write anything. */
export function getXComposeUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

/** Account notification settings — used as the email unsubscribe destination. */
export function getUnsubscribeUrl(): string {
  return `${getAppUrl()}/settings/account/notifications`;
}
