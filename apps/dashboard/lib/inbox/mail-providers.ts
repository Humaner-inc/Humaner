import {
  detectMailProviderFromEmail as detectSharedMailProviderFromEmail,
  type MailProviderDetection as SharedMailProviderDetection
} from '@humaner/shared/mail-provider-detect';
import {
  getLandingMailProviders,
  getMailProviderById as getSharedMailProviderById,
  getMailProvidersGrouped as getSharedMailProvidersGrouped,
  MAIL_CONNECT_KIND_LABELS,
  mailProviderImapAvailable,
  mailProviderOauthAvailable,
  mailProviderUsesAppPassword,
  MAIL_PROVIDERS as SHARED_MAIL_PROVIDERS,
  type MailConnectKind,
  type MailProviderDefinition as SharedMailProvider
} from '@humaner/shared/mail-providers';

import { isOssDeployment } from '@/lib/deployment-mode';

export type MailProviderCategory = MailConnectKind;

export type MailProviderDefinition = SharedMailProvider & {
  category: MailConnectKind;
  logoDomain: string;
  imapAvailable: boolean;
  oauthAvailable: boolean;
  unavailableLabel?: string;
};

export const MAIL_PROVIDER_CATEGORY_LABELS: Record<
  MailProviderCategory,
  string
> = MAIL_CONNECT_KIND_LABELS;

function adaptProvider(provider: SharedMailProvider): MailProviderDefinition {
  const imapAvailable = mailProviderImapAvailable(provider);
  return {
    ...provider,
    category: provider.connect,
    logoDomain: provider.logoDomain ?? 'humaner.io',
    imapAvailable,
    oauthAvailable: mailProviderOauthAvailable(provider) && !isOssDeployment(),
    unavailableLabel: provider.connect === 'soon' ? 'Soon' : undefined
  };
}

/** Curated IMAP/SMTP presets — source is `@humaner/shared/mail-providers`. */
export const MAIL_PROVIDERS: MailProviderDefinition[] =
  SHARED_MAIL_PROVIDERS.map(adaptProvider);

const providerById = new Map(
  MAIL_PROVIDERS.map((provider) => [provider.id, provider])
);

export { mailProviderUsesAppPassword };

export function getMailProviderById(
  id: string
): MailProviderDefinition | undefined {
  return (
    providerById.get(id) ??
    (getSharedMailProviderById(id)
      ? adaptProvider(getSharedMailProviderById(id)!)
      : undefined)
  );
}

export function getMailProvidersGrouped(
  options: { featuredOnly?: boolean } = {}
): Array<{
  category: MailProviderCategory;
  label: string;
  providers: MailProviderDefinition[];
}> {
  const source = options.featuredOnly
    ? getLandingMailProviders()
    : SHARED_MAIL_PROVIDERS;
  const groups = getSharedMailProvidersGrouped(source).map((group) => ({
    category: group.connect,
    label: group.label,
    providers: group.providers.map(adaptProvider)
  }));
  if (!isOssDeployment()) {
    return groups;
  }
  return groups
    .map((group) => ({
      ...group,
      providers: group.providers.filter((provider) => provider.imapAvailable)
    }))
    .filter((group) => group.providers.length > 0);
}

export type DetectedMailProvider = {
  provider: MailProviderDefinition;
  kind: SharedMailProviderDetection['kind'];
  matched: string;
};

export function detectMailProviderFromEmail(
  email: string
): DetectedMailProvider | null {
  const detection = detectSharedMailProviderFromEmail(email);
  if (!detection) {
    return null;
  }
  return {
    provider: adaptProvider(detection.provider),
    kind: detection.kind,
    matched: detection.matched
  };
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
