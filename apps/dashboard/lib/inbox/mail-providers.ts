export type MailProviderCategory =
  | 'business'
  | 'european'
  | 'hosting'
  | 'consumer'
  | 'other';

export type MailProviderDefinition = {
  id: string;
  name: string;
  logoDomain: string;
  category: MailProviderCategory;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  /** When true, user must enter hosts in Advanced (cPanel, custom domain). */
  requiresCustomHosts?: boolean;
  /** IMAP connect is available today (false = OAuth-only, coming later). */
  imapAvailable: boolean;
  unavailableLabel?: string;
  setupNote?: string;
};

export const MAIL_PROVIDER_CATEGORY_LABELS: Record<
  MailProviderCategory,
  string
> = {
  business: 'Business mail suites',
  european: 'European hosts',
  hosting: 'Web hosting email',
  consumer: 'Consumer mail',
  other: 'Other'
};

/** Curated IMAP/SMTP presets for common business mail hosts. */
export const MAIL_PROVIDERS: MailProviderDefinition[] = [
  // Business suites
  {
    id: 'zoho',
    name: 'Zoho Mail',
    logoDomain: 'zoho.com',
    category: 'business',
    imapHost: 'imap.zoho.com',
    imapPort: 993,
    smtpHost: 'smtp.zoho.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'zoho-eu',
    name: 'Zoho Mail EU',
    logoDomain: 'zoho.eu',
    category: 'business',
    imapHost: 'imap.zoho.eu',
    imapPort: 993,
    smtpHost: 'smtp.zoho.eu',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'zoho-in',
    name: 'Zoho Mail India',
    logoDomain: 'zoho.in',
    category: 'business',
    imapHost: 'imap.zoho.in',
    imapPort: 993,
    smtpHost: 'smtp.zoho.in',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'fastmail',
    name: 'Fastmail',
    logoDomain: 'fastmail.com',
    category: 'business',
    imapHost: 'imap.fastmail.com',
    imapPort: 993,
    smtpHost: 'smtp.fastmail.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'migadu',
    name: 'Migadu',
    logoDomain: 'migadu.com',
    category: 'business',
    imapHost: 'imap.migadu.com',
    imapPort: 993,
    smtpHost: 'smtp.migadu.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'mailbox-org',
    name: 'Mailbox.org',
    logoDomain: 'mailbox.org',
    category: 'business',
    imapHost: 'imap.mailbox.org',
    imapPort: 993,
    smtpHost: 'smtp.mailbox.org',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'posteo',
    name: 'Posteo',
    logoDomain: 'posteo.de',
    category: 'business',
    imapHost: 'posteo.de',
    imapPort: 993,
    smtpHost: 'posteo.de',
    smtpPort: 587,
    imapAvailable: true
  },
  {
    id: 'mailfence',
    name: 'Mailfence',
    logoDomain: 'mailfence.com',
    category: 'business',
    imapHost: 'imap.mailfence.com',
    imapPort: 993,
    smtpHost: 'smtp.mailfence.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'kolabnow',
    name: 'Kolab Now',
    logoDomain: 'kolabnow.com',
    category: 'business',
    imapHost: 'imap.kolabnow.com',
    imapPort: 993,
    smtpHost: 'smtp.kolabnow.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'runbox',
    name: 'Runbox',
    logoDomain: 'runbox.com',
    category: 'business',
    imapHost: 'mail.runbox.com',
    imapPort: 993,
    smtpHost: 'smtp.runbox.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'titan',
    name: 'Titan Email',
    logoDomain: 'titan.email',
    category: 'business',
    imapHost: 'imap.titan.email',
    imapPort: 993,
    smtpHost: 'smtp.titan.email',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'neo',
    name: 'Neo',
    logoDomain: 'neo.space',
    category: 'business',
    imapHost: 'imap.neo.space',
    imapPort: 993,
    smtpHost: 'smtp.neo.space',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'rackspace',
    name: 'Rackspace Email',
    logoDomain: 'rackspace.com',
    category: 'business',
    imapHost: 'secure.emailsrvr.com',
    imapPort: 993,
    smtpHost: 'secure.emailsrvr.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    logoDomain: 'google.com',
    category: 'business',
    imapAvailable: false,
    unavailableLabel: 'soon available'
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    logoDomain: 'microsoft.com',
    category: 'business',
    imapAvailable: false,
    unavailableLabel: 'Soon available'
  },
  {
    id: 'proton',
    name: 'Proton Mail',
    logoDomain: 'proton.me',
    category: 'business',
    imapAvailable: false,
    unavailableLabel: 'Soon available'
  },

  // European hosts
  {
    id: 'ionos',
    name: 'IONOS',
    logoDomain: 'ionos.com',
    category: 'european',
    imapHost: 'imap.ionos.com',
    imapPort: 993,
    smtpHost: 'smtp.ionos.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'ionos-fr',
    name: 'IONOS France',
    logoDomain: 'ionos.fr',
    category: 'european',
    imapHost: 'imap.ionos.fr',
    imapPort: 993,
    smtpHost: 'smtp.ionos.fr',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'ionos-de',
    name: 'IONOS Germany',
    logoDomain: 'ionos.de',
    category: 'european',
    imapHost: 'imap.ionos.de',
    imapPort: 993,
    smtpHost: 'smtp.ionos.de',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'ovh',
    name: 'OVH',
    logoDomain: 'ovh.com',
    category: 'european',
    imapHost: 'ssl0.ovh.net',
    imapPort: 993,
    smtpHost: 'ssl0.ovh.net',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'o2switch',
    name: 'o2switch',
    logoDomain: 'o2switch.fr',
    category: 'european',
    imapHost: 'ex2.mail.ovh.net',
    imapPort: 993,
    smtpHost: 'ssl0.ovh.net',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'gandi',
    name: 'Gandi',
    logoDomain: 'gandi.net',
    category: 'european',
    imapHost: 'mail.gandi.net',
    imapPort: 993,
    smtpHost: 'mail.gandi.net',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'infomaniak',
    name: 'Infomaniak',
    logoDomain: 'infomaniak.com',
    category: 'european',
    imapHost: 'imap.infomaniak.com',
    imapPort: 993,
    smtpHost: 'mail.infomaniak.com',
    smtpPort: 587,
    imapAvailable: true
  },
  {
    id: 'one-com',
    name: 'one.com',
    logoDomain: 'one.com',
    category: 'european',
    imapHost: 'imap.one.com',
    imapPort: 993,
    smtpHost: 'send.one.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'strato',
    name: 'Strato',
    logoDomain: 'strato.de',
    category: 'european',
    imapHost: 'imap.strato.de',
    imapPort: 993,
    smtpHost: 'smtp.strato.de',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'aruba',
    name: 'Aruba',
    logoDomain: 'aruba.it',
    category: 'european',
    imapHost: 'imaps.aruba.it',
    imapPort: 993,
    smtpHost: 'smtps.aruba.it',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'register-it',
    name: 'Register.it',
    logoDomain: 'register.it',
    category: 'european',
    imapHost: 'imaps.aruba.it',
    imapPort: 993,
    smtpHost: 'smtps.aruba.it',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'transip',
    name: 'TransIP',
    logoDomain: 'transip.eu',
    category: 'european',
    imapHost: 'imap.transip.email',
    imapPort: 993,
    smtpHost: 'smtp.transip.email',
    smtpPort: 465,
    imapAvailable: true
  },

  // Web hosting
  {
    id: 'godaddy',
    name: 'GoDaddy',
    logoDomain: 'godaddy.com',
    category: 'hosting',
    imapHost: 'imap.secureserver.net',
    imapPort: 993,
    smtpHost: 'smtpout.secureserver.net',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'namecheap',
    name: 'Namecheap Private Email',
    logoDomain: 'namecheap.com',
    category: 'hosting',
    imapHost: 'mail.privateemail.com',
    imapPort: 993,
    smtpHost: 'mail.privateemail.com',
    smtpPort: 465,
    imapAvailable: true,
    setupNote:
      'Use your full email as username and enable SMTP on Private Email.'
  },
  {
    id: 'hostinger',
    name: 'Hostinger',
    logoDomain: 'hostinger.com',
    category: 'hosting',
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'bluehost',
    name: 'Bluehost',
    logoDomain: 'bluehost.com',
    category: 'hosting',
    imapHost: 'mail.bluehost.com',
    imapPort: 993,
    smtpHost: 'mail.bluehost.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'dreamhost',
    name: 'DreamHost',
    logoDomain: 'dreamhost.com',
    category: 'hosting',
    imapHost: 'imap.dreamhost.com',
    imapPort: 993,
    smtpHost: 'smtp.dreamhost.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'siteground',
    name: 'SiteGround',
    logoDomain: 'siteground.com',
    category: 'hosting',
    requiresCustomHosts: true,
    imapAvailable: true,
    setupNote: 'Use mail.yourdomain.com for IMAP and SMTP (ports 993 / 465).'
  },
  {
    id: 'a2hosting',
    name: 'A2 Hosting',
    logoDomain: 'a2hosting.com',
    category: 'hosting',
    requiresCustomHosts: true,
    imapAvailable: true,
    setupNote: 'Use mail.yourdomain.com or the server hostname from your panel.'
  },
  {
    id: 'inmotion',
    name: 'InMotion Hosting',
    logoDomain: 'inmotionhosting.com',
    category: 'hosting',
    requiresCustomHosts: true,
    imapAvailable: true,
    setupNote: 'Use mail.yourdomain.com (ports 993 / 465).'
  },
  {
    id: 'hostgator',
    name: 'HostGator',
    logoDomain: 'hostgator.com',
    category: 'hosting',
    requiresCustomHosts: true,
    imapAvailable: true,
    setupNote: 'Use mail.yourdomain.com (ports 993 / 465).'
  },
  {
    id: 'hover',
    name: 'Hover',
    logoDomain: 'hover.com',
    category: 'hosting',
    imapHost: 'mail.hover.com',
    imapPort: 993,
    smtpHost: 'mail.hover.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'porkbun',
    name: 'Porkbun',
    logoDomain: 'porkbun.com',
    category: 'hosting',
    imapHost: 'mail.porkbun.com',
    imapPort: 993,
    smtpHost: 'mail.porkbun.com',
    smtpPort: 465,
    imapAvailable: true
  },
  {
    id: 'cpanel',
    name: 'cPanel / Plesk',
    logoDomain: 'cpanel.net',
    category: 'hosting',
    requiresCustomHosts: true,
    imapAvailable: true,
    setupNote: 'Use mail.yourdomain.com for both IMAP and SMTP.'
  },

  // Consumer mail (app passwords often required)
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    logoDomain: 'yahoo.com',
    category: 'consumer',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    imapAvailable: true,
    setupNote: 'Generate an app password in Yahoo account security settings.'
  },
  {
    id: 'aol',
    name: 'AOL Mail',
    logoDomain: 'aol.com',
    category: 'consumer',
    imapHost: 'imap.aol.com',
    imapPort: 993,
    smtpHost: 'smtp.aol.com',
    smtpPort: 465,
    imapAvailable: true,
    setupNote: 'Generate an app password in AOL account security settings.'
  },
  {
    id: 'icloud',
    name: 'iCloud Mail',
    logoDomain: 'icloud.com',
    category: 'consumer',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    imapAvailable: true,
    setupNote: 'Use an app-specific password from appleid.apple.com.'
  },
  {
    id: 'gmx',
    name: 'GMX',
    logoDomain: 'gmx.com',
    category: 'consumer',
    imapHost: 'imap.gmx.net',
    imapPort: 993,
    smtpHost: 'mail.gmx.net',
    smtpPort: 587,
    imapAvailable: true
  },
  {
    id: 'web-de',
    name: 'WEB.DE',
    logoDomain: 'web.de',
    category: 'consumer',
    imapHost: 'imap.web.de',
    imapPort: 993,
    smtpHost: 'smtp.web.de',
    smtpPort: 587,
    imapAvailable: true
  },
  {
    id: 'mail-com',
    name: 'Mail.com',
    logoDomain: 'mail.com',
    category: 'consumer',
    imapHost: 'imap.mail.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.com',
    smtpPort: 465,
    imapAvailable: true
  },

  // Other
  {
    id: 'custom',
    name: 'Other / Custom',
    logoDomain: 'humaner.io',
    category: 'other',
    requiresCustomHosts: true,
    imapAvailable: true,
    setupNote: 'Enter your provider IMAP and SMTP hosts in Advanced.'
  }
];

const providerById = new Map(
  MAIL_PROVIDERS.map((provider) => [provider.id, provider])
);

export function getMailProviderById(
  id: string
): MailProviderDefinition | undefined {
  return providerById.get(id);
}

export function getMailProvidersGrouped(): Array<{
  category: MailProviderCategory;
  label: string;
  providers: MailProviderDefinition[];
}> {
  const order: MailProviderCategory[] = [
    'business',
    'european',
    'hosting',
    'consumer',
    'other'
  ];

  return order.map((category) => ({
    category,
    label: MAIL_PROVIDER_CATEGORY_LABELS[category],
    providers: MAIL_PROVIDERS.filter(
      (provider) => provider.category === category
    )
  }));
}

export type MailProviderPreset = {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  label: string;
};

export function resolveMailProviderPreset(
  providerId: string
): MailProviderPreset | null {
  const provider = getMailProviderById(providerId);
  if (
    !provider?.imapAvailable ||
    provider.requiresCustomHosts ||
    !provider.imapHost ||
    !provider.imapPort ||
    !provider.smtpHost ||
    !provider.smtpPort
  ) {
    return null;
  }

  return {
    label: provider.name,
    imapHost: provider.imapHost,
    imapPort: provider.imapPort,
    smtpHost: provider.smtpHost,
    smtpPort: provider.smtpPort
  };
}
