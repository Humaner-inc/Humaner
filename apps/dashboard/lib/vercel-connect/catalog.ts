import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';

export const VERCEL_CONNECT_MESSAGE = 'humaner-vercel-connect';

export type VercelConnectAppCatalog = {
  id: CompanionIntegrationId;
  name: string;
  envKey: string;
  webhookEnvKey?: string;
  createCommand: string;
  attachCommand: string;
  triggerPath?: string;
  scopes?: string[];
  setup: string[];
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
    createCommand: 'vercel connect create linear --name humaner',
    attachCommand:
      'vercel connect attach $VERCEL_CONNECT_LINEAR_UID --triggers --trigger-path /api/dashboard/connect/linear',
    triggerPath: '/api/dashboard/connect/linear',
    setup: [
      'App name: Humaner.',
      'Install Vercel’s Linear app per workspace.',
      'Triggers: Issue and Comment.',
      'Link Production, Preview, and Development to the dashboard project.',
      'Set VERCEL_CONNECT_LINEAR_UID and VERCEL_CONNECT_LINEAR_WEBHOOK.',
      'Companion uses a user-subject token for the workspace owner’s Linear workspace.'
    ]
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    envKey: 'VERCEL_CONNECT_STRIPE_UID',
    createCommand: 'vercel connect create stripe --name humaner',
    attachCommand: 'vercel connect attach $VERCEL_CONNECT_STRIPE_UID',
    setup: [
      'App name: Humaner.',
      'Use the Stripe connector (or `https://mcp.stripe.com` if the CLI asks for a server URL).',
      'No trigger forwarding — Stripe events stay on Stripe webhooks.',
      'Set VERCEL_CONNECT_STRIPE_UID.',
      'Authorize as a user so Companion reads customers, invoices, and subscriptions for that account.',
      'Link Production, Preview, and Development to the dashboard project.'
    ]
  },
  github: {
    id: 'github',
    name: 'GitHub',
    envKey: 'VERCEL_CONNECT_GITHUB_UID',
    webhookEnvKey: 'VERCEL_CONNECT_GITHUB_WEBHOOK',
    createCommand: 'vercel connect create github --name humaner',
    attachCommand:
      'vercel connect attach $VERCEL_CONNECT_GITHUB_UID --triggers --trigger-path /api/dashboard/connect/github',
    triggerPath: '/api/dashboard/connect/github',
    setup: [
      'App name: Humaner.',
      'GitHub namespace: the org or user that owns the Humaner GitHub App install.',
      'Permissions (11): Metadata (read, required), Contents (read), Issues (read & write), Pull requests (read & write), Deployments (read), Actions (read), Checks (read), Commit statuses (read), Members (read), Organization administration (read), Dependabot alerts (read).',
      'Triggers (2): issues and pull_request.',
      'Event types to forward: issues, issue_comment, pull_request, pull_request_review, deployment_status.',
      'Set VERCEL_CONNECT_GITHUB_UID and VERCEL_CONNECT_GITHUB_WEBHOOK.',
      'Link Production, Preview, and Development to the dashboard project.'
    ]
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
