import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';

export const VERCEL_CONNECT_MESSAGE = 'humaner-vercel-connect';

export type VercelConnectSubject = 'app' | 'user';

export type VercelConnectAppCatalog = {
  id: CompanionIntegrationId;
  name: string;
  envKey: string;
  webhookEnvKey?: string;
  /**
   * Linear and GitHub were created as managed app connectors
   * (`linear/app-humaner`, `github/app-humaner`). User OAuth against those
   * fails in the Connect portal with "couldn't connect".
   */
  subject: VercelConnectSubject;
  scopes?: string[];
};

export const VERCEL_CONNECT_APPS: Record<
  CompanionIntegrationId,
  VercelConnectAppCatalog
> = {
  linear: {
    id: 'linear',
    name: 'Linear',
    envKey: 'VERCEL_CONNECT_LINEAR_UID',
    webhookEnvKey: 'VERCEL_CONNECT_LINEAR_WEBHOOK',
    subject: 'app'
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    envKey: 'VERCEL_CONNECT_STRIPE_UID',
    subject: 'user'
  },
  github: {
    id: 'github',
    name: 'GitHub',
    envKey: 'VERCEL_CONNECT_GITHUB_UID',
    webhookEnvKey: 'VERCEL_CONNECT_GITHUB_WEBHOOK',
    subject: 'app'
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    envKey: 'VERCEL_CONNECT_NOTION_UID',
    subject: 'user'
  }
};

export function getVercelConnectUid(id: CompanionIntegrationId): string {
  const catalog = VERCEL_CONNECT_APPS[id];
  const fromEnv = process.env[catalog.envKey]?.trim();
  if (!fromEnv) {
    throw new Error(
      `${catalog.name} is not configured. Set ${catalog.envKey}.`
    );
  }
  return fromEnv;
}

export function getVercelConnectWebhookUrl(
  id: CompanionIntegrationId
): string | undefined {
  const catalog = VERCEL_CONNECT_APPS[id];
  if (!catalog.webhookEnvKey) {
    return undefined;
  }
  return process.env[catalog.webhookEnvKey]?.trim() || undefined;
}
