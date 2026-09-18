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

/**
 * Public id of the platform Humaner support agent.
 * Landing Companion does not send this; dashboard APIs resolve it server-side.
 * Prefer `HUMANER_AGENT_ID` (server-only). `NEXT_PUBLIC_*` remains a fallback.
 */
export function getHumanerAgentPublicId(): string | undefined {
  const id =
    process.env.HUMANER_AGENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_HUMANER_AGENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_DEMO_AGENT_ID?.trim();
  return id || undefined;
}

/** Compact mark — favicon, dark theme, and icons. */
export const HUMANER_ICON_PATH = "/favicon.svg";
/** Light surfaces — dark ink brandmark. */
export const HUMANER_ICON_BLACK_PATH = "/brandmark-dark.svg";
/** Brandmark on light chrome — emails + light theme. */
export const HUMANER_BRANDMARK_PATH = "/brandmark-dark.svg";
/** Full brand logo. */
export const HUMANER_LOGO_PATH = "/logo-black.png";

/** Mail header — cobalt brandmark (2× vector so clients stay sharp at 80px). */
export const EMAIL_LOGO_PATH = "/brandmark_blue.svg";

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
  workspace?: string;
  website?: string;
  timeZone?: string;
  mailbox?: string;
}): string {
  const base = `${getAppUrl()}/auth/signup`;
  if (!options) return base;
  const params = new URLSearchParams();
  if (options.plan) params.set("plan", options.plan);
  if (
    options.messages != null &&
    Number.isFinite(options.messages) &&
    options.messages > 0
  ) {
    params.set("messages", String(Math.floor(options.messages)));
  }
  if (options.workspace?.trim()) {
    params.set("workspace", options.workspace.trim());
  }
  if (options.website?.trim()) {
    params.set("website", options.website.trim());
  }
  if (options.timeZone?.trim()) {
    params.set("tz", options.timeZone.trim());
  }
  if (options.mailbox?.trim()) {
    params.set("mailbox", options.mailbox.trim());
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
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

export function getOssUrl(): string {
  return `${getLandingUrl()}/oss`;
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

export function getPricingUrl(): string {
  return `${getLandingUrl()}/pricing`;
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

/** Public Self-Host kit — pricing and onboarding Self-host CTAs go here. */
export function getHumanerGithubRepoUrl(): string {
  return "https://github.com/Humaner-inc/humaner";
}

export function getIntoMarkdownGithubUrl(): string {
  return "https://github.com/Humaner-inc/into-markdown";
}

/** Mailbox skill pack Companion and MCP agents share. */
export function getInboxSkillsGithubUrl(): string {
  return "https://github.com/Humaner-inc/Inbox-skills";
}

export function getXUrl(): string {
  return "https://x.com/usehumaner";
}

export function getXFollowUrl(): string {
  return "https://x.com/intent/follow?screen_name=usehumaner";
}

/** Prefilled compose — the user can edit or write anything. */
export function getXComposeUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

/** Account notification settings — used as the email unsubscribe destination. */
export function getUnsubscribeUrl(): string {
  return `${getAppUrl()}/settings/account/notifications`;
}
