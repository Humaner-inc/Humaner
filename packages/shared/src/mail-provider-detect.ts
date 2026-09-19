import {
  MAIL_PROVIDERS,
  type MailConnectKind,
  type MailProviderDefinition,
} from "./mail-providers";

export type MailProviderDetection = {
  provider: MailProviderDefinition;
  kind: Extract<MailConnectKind, "oauth" | "preset">;
  matched: string;
};

/**
 * Extra mailbox domains that are not the marketing logo host.
 * `logoDomain` is always indexed for oauth + preset tiles.
 */
const EXTRA_DETECT_DOMAINS: Readonly<Record<string, readonly string[]>> = {
  gmail: ["googlemail.com"],
  zoho: ["zoho.com"],
  "zoho-eu": ["zoho.eu"],
  "zoho-in": ["zoho.in"],
  fastmail: ["fastmail.fm"],
  icloud: ["me.com", "mac.com"],
  yahoo: ["ymail.com", "rocketmail.com", "yahoo.co.uk", "yahoo.fr"],
  gmx: ["gmx.net", "gmx.de"],
  ovh: ["ovh.net", "ovh.ie"],
  namecheap: ["privateemail.com"],
  godaddy: ["secureserver.net"],
  rackspace: ["emailsrvr.com"],
  titan: ["titan.email"],
};

/** Distinctive public suffixes → IMAP preset (e.g. alex@mycompany.ovh). */
const DETECT_TLDS: Readonly<Record<string, readonly string[]>> = {
  ovh: ["ovh"],
};

export function emailDomainFromAddress(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) {
    return null;
  }
  const domain = trimmed.slice(at + 1).replace(/\.$/, "");
  if (!domain.includes(".") || domain.startsWith(".") || domain.includes("@")) {
    return null;
  }
  return domain;
}

function indexDetectableProviders(
  providers: readonly MailProviderDefinition[],
): {
  byDomain: Map<string, MailProviderDetection>;
  byTld: Map<string, MailProviderDetection>;
} {
  const byDomain = new Map<string, MailProviderDetection>();
  const byTld = new Map<string, MailProviderDetection>();

  for (const provider of providers) {
    if (provider.connect !== "oauth" && provider.connect !== "preset") {
      continue;
    }
    const kind = provider.connect;
    const domains = [
      provider.logoDomain,
      ...(EXTRA_DETECT_DOMAINS[provider.id] ?? []),
    ].filter((domain): domain is string => Boolean(domain));

    for (const domain of domains) {
      const key = domain.toLowerCase();
      const current = byDomain.get(key);
      if (!current || key.length > current.matched.length) {
        byDomain.set(key, { provider, kind, matched: key });
      }
    }

    for (const tld of DETECT_TLDS[provider.id] ?? []) {
      const key = tld.toLowerCase();
      if (!byTld.has(key)) {
        byTld.set(key, { provider, kind, matched: `.${key}` });
      }
    }
  }

  return { byDomain, byTld };
}

let defaultIndex: ReturnType<typeof indexDetectableProviders> | null = null;

function getDefaultIndex(): ReturnType<typeof indexDetectableProviders> {
  if (!defaultIndex) {
    defaultIndex = indexDetectableProviders(MAIL_PROVIDERS);
  }
  return defaultIndex;
}

function matchDomain(
  domain: string,
  byDomain: Map<string, MailProviderDetection>,
): MailProviderDetection | null {
  let best: MailProviderDetection | null = byDomain.get(domain) ?? null;

  for (const [candidate, detection] of byDomain) {
    if (domain === candidate || domain.endsWith(`.${candidate}`)) {
      if (!best || candidate.length > best.matched.length) {
        best = { ...detection, matched: candidate };
      }
    }
  }

  return best;
}

export function detectMailProviderFromEmail(
  email: string,
  providers: readonly MailProviderDefinition[] = MAIL_PROVIDERS,
): MailProviderDetection | null {
  const domain = emailDomainFromAddress(email);
  if (!domain) {
    return null;
  }

  const index =
    providers === MAIL_PROVIDERS
      ? getDefaultIndex()
      : indexDetectableProviders(providers);

  const domainMatch = matchDomain(domain, index.byDomain);
  if (domainMatch) {
    return domainMatch;
  }

  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  return index.byTld.get(tld) ?? null;
}
