import { Routes } from '@/constants/routes';
import { toPublicPathname } from '@/lib/routes/public-pathname';

export const DASHBOARD_PAGE_KEYS = [
  'overview',
  'agents',
  'integrations',
  'history',
  'inbox',
  'tasks',
  'calendar',
  'desk',
  'human-desk',
  'settings'
] as const;

export type DashboardPageKey = (typeof DASHBOARD_PAGE_KEYS)[number];

export const DASHBOARD_PAGE_LABELS: Record<DashboardPageKey, string> = {
  overview: 'Organization',
  agents: 'Agents',
  integrations: 'Integrations',
  history: 'History',
  inbox: 'Inbox',
  tasks: 'Tasks',
  calendar: 'Calendar',
  desk: 'Desk',
  'human-desk': 'Human Desk',
  settings: 'Settings'
};

export const DEFAULT_TEAMMATE_PAGE_ACCESS: DashboardPageKey[] = [
  'overview',
  'inbox',
  'tasks',
  'calendar'
];

export const OWNER_ONLY_ROUTE_PREFIXES = [
  Routes.OrganizationInformation,
  Routes.Billing,
  Routes.Developers,
  Routes.AuditLogs
] as const;

export const ACCOUNT_ROUTE_PREFIXES = [
  Routes.Profile,
  Routes.Security,
  Routes.Notifications
] as const;

const PAGE_KEY_ROUTE_PREFIXES: { key: DashboardPageKey; prefix: string }[] = [
  { key: 'overview', prefix: Routes.Home },
  { key: 'overview', prefix: Routes.OrganizationTeam },
  { key: 'overview', prefix: Routes.OrganizationWorkspace },
  { key: 'integrations', prefix: Routes.Integrations },
  { key: 'history', prefix: Routes.History },
  { key: 'inbox', prefix: Routes.Inbox },
  { key: 'inbox', prefix: Routes.Resources },
  { key: 'inbox', prefix: '/resources' },
  { key: 'tasks', prefix: Routes.Tasks },
  { key: 'tasks', prefix: '/tasks' },
  { key: 'calendar', prefix: Routes.Calendar },
  { key: 'desk', prefix: Routes.Desk },
  { key: 'human-desk', prefix: Routes.HumanDesk },
  { key: 'settings', prefix: Routes.Settings }
];

export type ResolvedPathAccess =
  | { type: 'owner' }
  | { type: 'account' }
  | { type: 'platform-admin' }
  | { type: 'page'; pageKey: DashboardPageKey }
  | { type: 'unknown' };

export function resolvePathAccess(pathname: string): ResolvedPathAccess {
  const path = toPublicPathname(pathname);

  if (path.startsWith('/admin')) {
    return { type: 'platform-admin' };
  }

  if (OWNER_ONLY_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return { type: 'owner' };
  }

  if (ACCOUNT_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return { type: 'account' };
  }

  if (/^\/agents(\/|$)/.test(path)) {
    return { type: 'page', pageKey: 'agents' };
  }

  for (const entry of PAGE_KEY_ROUTE_PREFIXES) {
    if (path.startsWith(entry.prefix)) {
      return { type: 'page', pageKey: entry.key };
    }
  }

  return { type: 'unknown' };
}

export function isDashboardPageKey(value: string): value is DashboardPageKey {
  return (DASHBOARD_PAGE_KEYS as readonly string[]).includes(value);
}
