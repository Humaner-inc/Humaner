export type ConnectAppStatus = 'connect' | 'coming_soon';

export type ConnectAppId = 'linear' | 'stripe' | 'github' | 'notion';

export type ConnectApp = {
  id: ConnectAppId;
  name: string;
  description: string;
  logoDomain: string;
  status: ConnectAppStatus;
};

export const CONNECT_APPS: ConnectApp[] = [
  {
    id: 'linear',
    name: 'Linear',
    description: 'Turn a thread into an issue without leaving the mailbox.',
    logoDomain: 'linear.app',
    status: 'connect'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Customer billing beside the conversation.',
    logoDomain: 'stripe.com',
    status: 'connect'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Issues, PRs, and deploys in the same thread.',
    logoDomain: 'github.com',
    status: 'connect'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Pages as context for Companion or your agent.',
    logoDomain: 'notion.so',
    status: 'coming_soon'
  }
];
