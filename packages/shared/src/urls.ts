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

/** Tab / app icon — cobalt rounded tile. */
export const HUMANER_ICON_PATH = "/favicon.svg";
/** Ink mark for light surfaces and mail. */
export const HUMANER_ICON_BLACK_PATH = "/brandmark-dark.svg";
/** Main brand logo — cobalt figure on transparent. */
export const HUMANER_BRANDMARK_PATH = "/brandmark_blue.svg";

/** Mail header — raster of `brandmark-dark.svg` (clients drop SVG). */
export const EMAIL_LOGO_PATH = "/brandmark-dark.png";

export function getEmailLogoUrl(): string {
  return `${getAppUrl()}${EMAIL_LOGO_PATH}`;
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
  return getIntoMarkdownUrl();
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

export function getLinkedInUrl(): string {
  return "https://www.linkedin.com/company/usehumaner/";
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

const TRUSTED_NAV_HOSTS = new Set([
  "accounts.google.com",
  "auth.calendly.com",
  "login.microsoftonline.com",
  "github.com",
]);

const MAILTO_ADDRESS_RE = /^[^\s@/?]+@[^\s@/?]+\.[^\s@/?]+$/;

function hostnameAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (TRUSTED_NAV_HOSTS.has(host)) return true;
  if (host === "polar.sh" || host.endsWith(".polar.sh")) return true;
  if (host === "vercel.com" || host.endsWith(".vercel.com")) return true;
  return false;
}

function isSafeMailtoUrl(url: string): boolean {
  if (!url.toLowerCase().startsWith("mailto:")) return false;
  const rest = url.slice("mailto:".length);
  const [rawAddress, query] = rest.split("?");
  let address = rawAddress ?? "";
  try {
    address = decodeURIComponent(address);
  } catch {
    return false;
  }
  if (!MAILTO_ADDRESS_RE.test(address)) return false;
  if (!query) return true;
  const params = new URLSearchParams(query);
  for (const key of params.keys()) {
    if (key.toLowerCase() !== "subject" && key.toLowerCase() !== "body") {
      return false;
    }
  }
  return true;
}

function allowedAppOrigins(): string[] {
  const origins: string[] = [];
  for (const raw of [getAppUrl(), getLandingUrl(), getDocsUrl()]) {
    try {
      origins.push(new URL(raw).origin);
    } catch {
      // ignore invalid env URLs
    }
  }
  return origins;
}

/** Same-origin paths, mailto, or https hosts we generate (OAuth / Polar / Vercel). */
export function isTrustedNavigationUrl(
  url: string,
  currentOrigin?: string,
): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return !trimmed.includes("\\");
  }
  if (trimmed.toLowerCase().startsWith("mailto:")) {
    return isSafeMailtoUrl(trimmed);
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:") {
      if (currentOrigin && parsed.origin === currentOrigin) return true;
      if (allowedAppOrigins().includes(parsed.origin)) return true;
      return hostnameAllowed(parsed.hostname);
    }
    if (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function assignTrustedNavigation(url: string): boolean {
  if (typeof window === "undefined") return false;
  if (!isTrustedNavigationUrl(url, window.location.origin)) return false;
  window.location.assign(url);
  return true;
}

export function openTrustedPopup(
  url: string,
  target: string,
  features: string,
): Window | null {
  if (typeof window === "undefined") return null;
  if (!isTrustedNavigationUrl(url, window.location.origin)) return null;
  return window.open(url, target, features);
}
