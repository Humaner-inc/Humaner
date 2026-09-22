export type ConnectAppStatus = 'connect' | 'coming_soon';

export type ConnectAppId = 'linear' | 'stripe' | 'github' | 'notion';

export type ConnectAppCategoryId =
  | 'engineering'
  | 'billing'
  | 'knowledge'
  | 'communication'
  | 'automations'
  | 'crm';

export type ConnectApp = {
  id: string;
  name: string;
  description: string;
  logoDomain: string;
  status: ConnectAppStatus;
  category: ConnectAppCategoryId;
};

export const CONNECT_APP_CATEGORIES: Array<{
  id: ConnectAppCategoryId;
  label: string;
}> = [
  { id: 'engineering', label: 'Engineering' },
  { id: 'billing', label: 'E-commerce & billing' },
  { id: 'knowledge', label: 'Workspace' },
  { id: 'communication', label: 'Communication' },
  { id: 'automations', label: 'Automations' },
  { id: 'crm', label: 'CRM' }
];

/** Brand accent used on connector notification centers (mark + section tint). */
export type ConnectorBrand = {
  accent: string;
  markClassName: string;
  surfaceClassName: string;
};

export const CONNECTOR_BRAND: Record<ConnectAppId, ConnectorBrand> = {
  linear: {
    accent: '#5E6AD2',
    markClassName: 'bg-[#5E6AD2] text-white',
    surfaceClassName: 'bg-[#5E6AD2]/[0.08] dark:bg-[#5E6AD2]/[0.14]'
  },
  github: {
    accent: '#0969da',
    markClassName: 'bg-[#0A0D0D] text-white',
    surfaceClassName: 'bg-[#0969da]/[0.08] dark:bg-[#0969da]/[0.14]'
  },
  stripe: {
    accent: '#635BFF',
    markClassName: 'bg-[#635BFF] text-white',
    surfaceClassName: 'bg-[#635BFF]/[0.08] dark:bg-[#635BFF]/[0.14]'
  },
  notion: {
    accent: '#E03E3E',
    markClassName: 'border border-border/60 bg-[#0A0D0D] text-white',
    surfaceClassName: 'bg-[#E03E3E]/[0.08] dark:bg-[#E03E3E]/[0.12]'
  }
};

/** GitHub’s mark is black — invert it on dark surfaces. */
export function connectorLogoInvertClassName(domain: string): string {
  return domain === 'github.com' || domain.endsWith('.github.com')
    ? 'dark:brightness-0 dark:invert'
    : '';
}

export function getConnectApp(
  id: ConnectAppId
): ConnectApp & { id: ConnectAppId } {
  const app = CONNECT_APPS.find((item) => item.id === id);
  if (!app) {
    throw new Error(`Unknown connector: ${id}`);
  }
  return app;
}

export const CONNECT_APPS: Array<ConnectApp & { id: ConnectAppId }> = [
  {
    id: 'linear',
    name: 'Linear',
    description: 'Turn a thread into an issue without leaving the mailbox.',
    logoDomain: 'linear.app',
    status: 'connect',
    category: 'engineering'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Manage your repo and issues from your inbox.',
    logoDomain: 'github.com',
    status: 'connect',
    category: 'engineering'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Customer billing & invoices managed through Humaner.',
    logoDomain: 'stripe.com',
    status: 'connect',
    category: 'billing'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Pages as context for Companion or your agent.',
    logoDomain: 'notion.so',
    status: 'connect',
    category: 'knowledge'
  }
];

/** Directory shown in Workspace Settings → Connect. Soon apps stay greyed. */
export const WORKSPACE_CONNECT_APPS: ConnectApp[] = [
  ...CONNECT_APPS,
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Orders and refunds beside the customer thread.',
    logoDomain: 'shopify.com',
    status: 'coming_soon',
    category: 'billing'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Bring a channel into the mailbox when email is not enough.',
    logoDomain: 'slack.com',
    status: 'coming_soon',
    category: 'communication'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate mailbox work across the rest of your stack.',
    logoDomain: 'zapier.com',
    status: 'coming_soon',
    category: 'automations'
  },
  {
    id: 'make',
    name: 'Make',
    description: 'Connect Humaner to your favorite apps in minutes.',
    logoDomain: 'make.com',
    status: 'coming_soon',
    category: 'automations'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Contacts and deals without leaving the thread.',
    logoDomain: 'hubspot.com',
    status: 'coming_soon',
    category: 'crm'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'See the account next to the conversation.',
    logoDomain: 'salesforce.com',
    status: 'coming_soon',
    category: 'crm'
  }
];
