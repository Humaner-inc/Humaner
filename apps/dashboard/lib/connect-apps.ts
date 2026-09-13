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
    status: 'coming_soon',
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
