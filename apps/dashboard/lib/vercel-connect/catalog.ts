import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';

export const VERCEL_CONNECT_MESSAGE = 'humaner-vercel-connect';

export type VercelConnectAppCatalog = {
  id: CompanionIntegrationId;
  name: string;
  envKey: string;
  webhookEnvKey?: string;
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
    scopes: ['read', 'write']
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    envKey: 'VERCEL_CONNECT_STRIPE_UID'
  },
  github: {
    id: 'github',
    name: 'GitHub',
    envKey: 'VERCEL_CONNECT_GITHUB_UID',
    webhookEnvKey: 'VERCEL_CONNECT_GITHUB_WEBHOOK'
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    envKey: 'VERCEL_CONNECT_NOTION_UID'
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
