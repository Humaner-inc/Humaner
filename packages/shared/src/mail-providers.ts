/**
 * One mailbox-provider catalog. Landing, docs, mockups, and the dashboard
 * picker all read this file. Marketing cannot show a host the picker cannot
 * open — `showOnLanding` is a filter, not a second list.
 *
 * Classification is how you connect (Spark-style chips), not geography:
 *   oauth  — Google sign-in
 *   preset — documented IMAP/SMTP hosts filled in
 *   custom — customer pastes hosts from their panel
 *   soon   — listed, not connectable
 */

export type MailConnectKind = "oauth" | "preset" | "custom" | "soon";

export const MAIL_PROVIDERS_LEAD =
  "Gmail over OAuth. IMAP for the rest. Microsoft and Proton, soon.";

export const MAIL_CONNECT_KIND_ORDER: readonly MailConnectKind[] = [
  "oauth",
  "preset",
  "custom",
  "soon",
];

export const MAIL_CONNECT_KIND_LABELS: Record<MailConnectKind, string> = {
  oauth: "Google",
  preset: "IMAP",
  custom: "Your own host",
  soon: "Coming soon",
};

/** Short chip — same role as Spark's macOS / iOS / Windows badges. */
export const MAIL_CONNECT_KIND_BADGE: Record<MailConnectKind, string> = {
  oauth: "OAuth",
  preset: "IMAP",
  custom: "Hosts",
  soon: "Soon",
};

export const MAIL_CONNECT_KIND_DOCS: Record<
  MailConnectKind,
  { title: string; available: string; integration: string }
> = {
  oauth: {
    title: "Gmail / Google Workspace",
    available: "✓",
    integration: "OAuth. No app password. Company.com addresses use Workspace.",
  },
  preset: {
    title: "IMAP presets",
    available: "✓",
    integration:
      "Email + password, or an app password when the host requires it. Hosts are filled in.",
  },
  custom: {
    title: "Your own host",
    available: "✓",
    integration:
      "cPanel, Plesk, or any IMAP + SMTP. Paste the hosts from your panel.",
  },
  soon: {
    title: "Microsoft 365 / Proton",
    available: "Soon",
    integration:
      "Microsoft mail OAuth is not shipped. Proton needs Bridge and is not connectable yet.",
  },
};

export type MailProviderDefinition = {
  id: string;
  name: string;
  /** Null = generic IMAP tile (no brand favicon). */
  logoDomain: string | null;
  connect: MailConnectKind;
  /** `/providers`, footer, docs mockup. Must stay openable unless `soon`. */
  showOnLanding: boolean;
  /** One line — Spark list pattern. */
  summary: string;
  color?: string;
  setupNote?: string;
  /** Vendor page to create an app / app-specific password. */
  appPasswordUrl?: string;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  requiresCustomHosts?: boolean;
};

/** Fastmail and iCloud require an app / in-app password, not the account password. */
export function mailProviderUsesAppPassword(id: string): boolean {
  return id === "fastmail" || id === "icloud";
}

export const MAIL_PROVIDERS: readonly MailProviderDefinition[] = [
  {
    id: "gmail",
    name: "Gmail",
    logoDomain: "gmail.com",
    connect: "oauth",
    showOnLanding: true,
    summary: "Connect with Google. No app password.",
    color: "#EA4335",
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    logoDomain: "google.com",
    connect: "oauth",
    showOnLanding: true,
    summary: "Same Google OAuth for company.com addresses.",
    color: "#EA4335",
  },

  {
    id: "zoho",
    name: "Zoho Mail",
    logoDomain: "zoho.com",
    connect: "preset",
    showOnLanding: true,
    summary: "IMAP on zoho.com.",
    color: "#E42527",
    imapHost: "imap.zoho.com",
    imapPort: 993,
    smtpHost: "smtp.zoho.com",
    smtpPort: 465,
  },
  {
    id: "zoho-eu",
    name: "Zoho Mail EU",
    logoDomain: "zoho.eu",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP for mailboxes hosted in Zoho EU.",
    imapHost: "imap.zoho.eu",
    imapPort: 993,
    smtpHost: "smtp.zoho.eu",
    smtpPort: 465,
  },
  {
    id: "zoho-in",
    name: "Zoho Mail India",
    logoDomain: "zoho.in",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP for mailboxes hosted in Zoho India.",
    imapHost: "imap.zoho.in",
    imapPort: 993,
    smtpHost: "smtp.zoho.in",
    smtpPort: 465,
  },
  {
    id: "fastmail",
    name: "Fastmail",
    logoDomain: "fastmail.com",
    connect: "preset",
    showOnLanding: true,
    summary: "IMAP. Create an app password in Fastmail.",
    color: "#1665D8",
    imapHost: "imap.fastmail.com",
    imapPort: 993,
    smtpHost: "smtp.fastmail.com",
    smtpPort: 465,
    setupNote: "Create an app password in Fastmail → Privacy & Security.",
    appPasswordUrl: "https://app.fastmail.com/settings/security/apps",
  },
  {
    id: "migadu",
    name: "Migadu",
    logoDomain: "migadu.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Migadu’s documented hosts.",
    imapHost: "imap.migadu.com",
    imapPort: 993,
    smtpHost: "smtp.migadu.com",
    smtpPort: 465,
  },
  {
    id: "mailbox-org",
    name: "Mailbox.org",
    logoDomain: "mailbox.org",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on mailbox.org.",
    imapHost: "imap.mailbox.org",
    imapPort: 993,
    smtpHost: "smtp.mailbox.org",
    smtpPort: 465,
  },
  {
    id: "posteo",
    name: "Posteo",
    logoDomain: "posteo.de",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP and SMTP on posteo.de (port 587).",
    imapHost: "posteo.de",
    imapPort: 993,
    smtpHost: "posteo.de",
    smtpPort: 587,
  },
  {
    id: "mailfence",
    name: "Mailfence",
    logoDomain: "mailfence.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Mailfence.",
    imapHost: "imap.mailfence.com",
    imapPort: 993,
    smtpHost: "smtp.mailfence.com",
    smtpPort: 465,
  },
  {
    id: "kolabnow",
    name: "Kolab Now",
    logoDomain: "kolabnow.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Kolab Now.",
    imapHost: "imap.kolabnow.com",
    imapPort: 993,
    smtpHost: "smtp.kolabnow.com",
    smtpPort: 465,
  },
  {
    id: "runbox",
    name: "Runbox",
    logoDomain: "runbox.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Runbox.",
    imapHost: "mail.runbox.com",
    imapPort: 993,
    smtpHost: "smtp.runbox.com",
    smtpPort: 465,
  },
  {
    id: "titan",
    name: "Titan Email",
    logoDomain: "titan.email",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP for Titan, including Hostinger Titan accounts.",
    imapHost: "imap.titan.email",
    imapPort: 993,
    smtpHost: "smtp.titan.email",
    smtpPort: 465,
  },
  {
    id: "neo",
    name: "Neo",
    logoDomain: "neo.space",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Neo.",
    imapHost: "imap.neo.space",
    imapPort: 993,
    smtpHost: "smtp.neo.space",
    smtpPort: 465,
  },
  {
    id: "rackspace",
    name: "Rackspace Email",
    logoDomain: "rackspace.com",
    connect: "preset",
    showOnLanding: false,
    summary: "Classic Rackspace Email (emailsrvr.com), not Microsoft 365.",
    imapHost: "secure.emailsrvr.com",
    imapPort: 993,
    smtpHost: "secure.emailsrvr.com",
    smtpPort: 465,
  },
  {
    id: "ionos",
    name: "IONOS",
    logoDomain: "ionos.com",
    connect: "preset",
    showOnLanding: true,
    summary: "IMAP on ionos.com.",
    color: "#003D8F",
    imapHost: "imap.ionos.com",
    imapPort: 993,
    smtpHost: "smtp.ionos.com",
    smtpPort: 465,
  },
  {
    id: "ionos-fr",
    name: "IONOS France",
    logoDomain: "ionos.fr",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP for IONOS France mailboxes.",
    imapHost: "imap.ionos.fr",
    imapPort: 993,
    smtpHost: "smtp.ionos.fr",
    smtpPort: 465,
  },
  {
    id: "ionos-de",
    name: "IONOS Germany",
    logoDomain: "ionos.de",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP for IONOS Germany mailboxes.",
    imapHost: "imap.ionos.de",
    imapPort: 993,
    smtpHost: "smtp.ionos.de",
    smtpPort: 465,
  },
  {
    id: "ovh",
    name: "OVH",
    logoDomain: "ovh.com",
    connect: "preset",
    showOnLanding: true,
    summary: "Shared MX (ssl0.ovh.net). Pro or Exchange: paste hosts.",
    color: "#0050D4",
    imapHost: "ssl0.ovh.net",
    imapPort: 993,
    smtpHost: "ssl0.ovh.net",
    smtpPort: 465,
  },
  {
    id: "o2switch",
    name: "o2switch",
    logoDomain: "o2switch.fr",
    connect: "preset",
    showOnLanding: false,
    summary: "One OVH cluster preset. Other clusters: paste hosts.",
    imapHost: "ex2.mail.ovh.net",
    imapPort: 993,
    smtpHost: "ssl0.ovh.net",
    smtpPort: 465,
  },
  {
    id: "gandi",
    name: "Gandi",
    logoDomain: "gandi.net",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on mail.gandi.net.",
    imapHost: "mail.gandi.net",
    imapPort: 993,
    smtpHost: "mail.gandi.net",
    smtpPort: 465,
  },
  {
    id: "infomaniak",
    name: "Infomaniak",
    logoDomain: "infomaniak.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Infomaniak (SMTP 587).",
    imapHost: "imap.infomaniak.com",
    imapPort: 993,
    smtpHost: "mail.infomaniak.com",
    smtpPort: 587,
  },
  {
    id: "one-com",
    name: "one.com",
    logoDomain: "one.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on imap.one.com / send.one.com.",
    imapHost: "imap.one.com",
    imapPort: 993,
    smtpHost: "send.one.com",
    smtpPort: 465,
  },
  {
    id: "strato",
    name: "Strato",
    logoDomain: "strato.de",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Strato.",
    imapHost: "imap.strato.de",
    imapPort: 993,
    smtpHost: "smtp.strato.de",
    smtpPort: 465,
  },
  {
    id: "aruba",
    name: "Aruba",
    logoDomain: "aruba.it",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Aruba.",
    imapHost: "imaps.aruba.it",
    imapPort: 993,
    smtpHost: "smtps.aruba.it",
    smtpPort: 465,
  },
  {
    id: "register-it",
    name: "Register.it",
    logoDomain: "register.it",
    connect: "preset",
    showOnLanding: false,
    summary: "Same Aruba mail hosts as Register.it.",
    imapHost: "imaps.aruba.it",
    imapPort: 993,
    smtpHost: "smtps.aruba.it",
    smtpPort: 465,
  },
  {
    id: "transip",
    name: "TransIP",
    logoDomain: "transip.eu",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on TransIP Email.",
    imapHost: "imap.transip.email",
    imapPort: 993,
    smtpHost: "smtp.transip.email",
    smtpPort: 465,
  },
  {
    id: "godaddy",
    name: "GoDaddy",
    logoDomain: "godaddy.com",
    connect: "preset",
    showOnLanding: true,
    summary: "Workspace Email (secureserver.net), not Microsoft 365.",
    color: "#1BDBDB",
    imapHost: "imap.secureserver.net",
    imapPort: 993,
    smtpHost: "smtpout.secureserver.net",
    smtpPort: 465,
  },
  {
    id: "namecheap",
    name: "Namecheap Private Email",
    logoDomain: "namecheap.com",
    connect: "preset",
    showOnLanding: true,
    summary: "Private Email. Enable SMTP in the Namecheap panel.",
    color: "#DE3723",
    imapHost: "mail.privateemail.com",
    imapPort: 993,
    smtpHost: "mail.privateemail.com",
    smtpPort: 465,
    setupNote:
      "Use your full email as username and enable SMTP on Private Email.",
  },
  {
    id: "hostinger",
    name: "Hostinger",
    logoDomain: "hostinger.com",
    connect: "preset",
    showOnLanding: true,
    summary: "Hostinger Mail. Titan accounts pick Titan in the app.",
    color: "#673DE6",
    imapHost: "imap.hostinger.com",
    imapPort: 993,
    smtpHost: "smtp.hostinger.com",
    smtpPort: 465,
  },
  {
    id: "bluehost",
    name: "Bluehost",
    logoDomain: "bluehost.com",
    connect: "preset",
    showOnLanding: false,
    summary: "Brochure host. Some accounts need boxXXXX.bluehost.com.",
    imapHost: "mail.bluehost.com",
    imapPort: 993,
    smtpHost: "mail.bluehost.com",
    smtpPort: 465,
  },
  {
    id: "dreamhost",
    name: "DreamHost",
    logoDomain: "dreamhost.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on DreamHost.",
    imapHost: "imap.dreamhost.com",
    imapPort: 993,
    smtpHost: "smtp.dreamhost.com",
    smtpPort: 465,
  },
  {
    id: "hover",
    name: "Hover",
    logoDomain: "hover.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Hover.",
    imapHost: "mail.hover.com",
    imapPort: 993,
    smtpHost: "mail.hover.com",
    smtpPort: 465,
  },
  {
    id: "porkbun",
    name: "Porkbun",
    logoDomain: "porkbun.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Porkbun. Titan resale picks Titan in the app.",
    imapHost: "mail.porkbun.com",
    imapPort: 993,
    smtpHost: "mail.porkbun.com",
    smtpPort: 465,
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    logoDomain: "yahoo.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP. App password required.",
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    setupNote: "Create an app password in Yahoo account security.",
    appPasswordUrl: "https://login.yahoo.com/account/security",
  },
  {
    id: "aol",
    name: "AOL Mail",
    logoDomain: "aol.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP. App password required.",
    imapHost: "imap.aol.com",
    imapPort: 993,
    smtpHost: "smtp.aol.com",
    smtpPort: 465,
    setupNote: "Create an app password in AOL account security.",
    appPasswordUrl: "https://login.aol.com/account/security",
  },
  {
    id: "icloud",
    name: "iCloud Mail",
    logoDomain: "icloud.com",
    connect: "preset",
    showOnLanding: true,
    summary: "IMAP. Create an app-specific password at appleid.apple.com.",
    color: "#A2AAAD",
    imapHost: "imap.mail.me.com",
    imapPort: 993,
    smtpHost: "smtp.mail.me.com",
    smtpPort: 587,
    setupNote: "Create an app-specific password at appleid.apple.com.",
    appPasswordUrl: "https://appleid.apple.com/account/manage",
  },
  {
    id: "gmx",
    name: "GMX",
    logoDomain: "gmx.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP. Enable IMAP in GMX webmail first.",
    imapHost: "imap.gmx.net",
    imapPort: 993,
    smtpHost: "mail.gmx.net",
    smtpPort: 587,
  },
  {
    id: "web-de",
    name: "WEB.DE",
    logoDomain: "web.de",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP. Enable IMAP in WEB.DE webmail first.",
    imapHost: "imap.web.de",
    imapPort: 993,
    smtpHost: "smtp.web.de",
    smtpPort: 587,
  },
  {
    id: "mail-com",
    name: "Mail.com",
    logoDomain: "mail.com",
    connect: "preset",
    showOnLanding: false,
    summary: "IMAP on Mail.com.",
    imapHost: "imap.mail.com",
    imapPort: 993,
    smtpHost: "smtp.mail.com",
    smtpPort: 465,
  },

  {
    id: "cpanel",
    name: "cPanel / Plesk",
    logoDomain: "cpanel.net",
    connect: "custom",
    showOnLanding: true,
    summary: "Paste mail.yourdomain.com from the hosting panel.",
    color: "#FF6C2C",
    requiresCustomHosts: true,
    setupNote: "Use mail.yourdomain.com for both IMAP and SMTP.",
  },
  {
    id: "siteground",
    name: "SiteGround",
    logoDomain: "siteground.com",
    connect: "custom",
    showOnLanding: false,
    summary: "No shared host. Paste mail.yourdomain.com.",
    requiresCustomHosts: true,
    setupNote: "Use mail.yourdomain.com for IMAP and SMTP (ports 993 / 465).",
  },
  {
    id: "a2hosting",
    name: "A2 Hosting",
    logoDomain: "a2hosting.com",
    connect: "custom",
    showOnLanding: false,
    summary: "No shared host. Paste the hostname from the panel.",
    requiresCustomHosts: true,
    setupNote:
      "Use mail.yourdomain.com or the server hostname from your panel.",
  },
  {
    id: "inmotion",
    name: "InMotion Hosting",
    logoDomain: "inmotionhosting.com",
    connect: "custom",
    showOnLanding: false,
    summary: "No shared host. Paste mail.yourdomain.com.",
    requiresCustomHosts: true,
    setupNote: "Use mail.yourdomain.com (ports 993 / 465).",
  },
  {
    id: "hostgator",
    name: "HostGator",
    logoDomain: "hostgator.com",
    connect: "custom",
    showOnLanding: false,
    summary: "No shared host. Paste mail.yourdomain.com.",
    requiresCustomHosts: true,
    setupNote: "Use mail.yourdomain.com (ports 993 / 465).",
  },
  {
    id: "custom",
    name: "Other / Custom",
    logoDomain: null,
    connect: "custom",
    showOnLanding: true,
    summary: "Any IMAP + SMTP host. Enter the servers in Advanced.",
    requiresCustomHosts: true,
    setupNote: "Enter your provider IMAP and SMTP hosts in Advanced.",
  },

  {
    id: "microsoft-365",
    name: "Microsoft 365",
    logoDomain: "microsoft.com",
    connect: "soon",
    showOnLanding: true,
    summary: "Mail OAuth is not shipped yet.",
    color: "#0078D4",
  },
  {
    id: "proton",
    name: "Proton Mail",
    logoDomain: "proton.me",
    connect: "soon",
    showOnLanding: true,
    summary: "Needs Proton Bridge. Not connectable from the cloud.",
    color: "#6D4AFF",
  },
];

export type MailProviderGroup = {
  connect: MailConnectKind;
  label: string;
  badge: string;
  providers: MailProviderDefinition[];
};

export function isMailProviderOpenable(
  provider: MailProviderDefinition,
): boolean {
  return provider.connect !== "soon";
}

export function mailProviderImapAvailable(
  provider: MailProviderDefinition,
): boolean {
  return provider.connect === "preset" || provider.connect === "custom";
}

export function mailProviderOauthAvailable(
  provider: MailProviderDefinition,
): boolean {
  return provider.connect === "oauth";
}

export function getLandingMailProviders(): MailProviderDefinition[] {
  return MAIL_PROVIDERS.filter((provider) => provider.showOnLanding);
}

export function getMailProvidersGrouped(
  providers: readonly MailProviderDefinition[] = MAIL_PROVIDERS,
): MailProviderGroup[] {
  return MAIL_CONNECT_KIND_ORDER.map((connect) => ({
    connect,
    label: MAIL_CONNECT_KIND_LABELS[connect],
    badge: MAIL_CONNECT_KIND_BADGE[connect],
    providers: providers.filter((provider) => provider.connect === connect),
  })).filter((group) => group.providers.length > 0);
}

const providerById = new Map(
  MAIL_PROVIDERS.map((provider) => [provider.id, provider]),
);

export function getMailProviderById(
  id: string,
): MailProviderDefinition | undefined {
  return providerById.get(id);
}

export function mailProviderLogoUrl(domain: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

export function mailProviderHighlightInk(color: string): "#0a0d0d" | "#F2F2F2" {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return "#F2F2F2";
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.62 ? "#0a0d0d" : "#F2F2F2";
}
