import { Routes } from '@/constants/routes';

export const DASHBOARD_PAGE_KEYS = [
  'overview',
  'agents',
  'knowledge',
  'integrations',
  'analytics',
  'history',
  'desk',
  'human-desk',
  'settings'
] as const;

export type DashboardPageKey = (typeof DASHBOARD_PAGE_KEYS)[number];

export const DASHBOARD_PAGE_LABELS: Record<DashboardPageKey, string> = {
  overview: 'Dashboard',
  agents: 'Agents',
  knowledge: 'Knowledge',
  integrations: 'Integrations',
  analytics: 'Analytics',
  history: 'History',
  desk: 'Desk',
  'human-desk': 'Human Desk',
  settings: 'Settings'
};

export const DEFAULT_TEAMMATE_PAGE_ACCESS: DashboardPageKey[] = [
  'overview',
  'desk'
];

export const OWNER_ONLY_ROUTE_PREFIXES = [
  Routes.OrganizationInformation,
  Routes.Members,
  Routes.Billing,
  Routes.Developers
] as const;

export const ACCOUNT_ROUTE_PREFIXES = [
  Routes.Profile,
  Routes.Security,
  Routes.Notifications
] as const;

const PAGE_KEY_ROUTE_PREFIXES: { key: DashboardPageKey; prefix: string }[] = [
  { key: 'overview', prefix: Routes.Home },
  { key: 'overview', prefix: Routes.Agents },
  { key: 'knowledge', prefix: Routes.Knowledge },
  { key: 'integrations', prefix: Routes.Integrations },
  { key: 'analytics', prefix: Routes.Analytics },
  { key: 'history', prefix: Routes.History },
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
  if (pathname.startsWith(Routes.AdminTickets)) {
    return { type: 'platform-admin' };
  }

  if (
    OWNER_ONLY_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return { type: 'owner' };
  }

  if (ACCOUNT_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return { type: 'account' };
  }

  for (const entry of PAGE_KEY_ROUTE_PREFIXES) {
    if (pathname.startsWith(entry.prefix)) {
      return { type: 'page', pageKey: entry.key };
    }
  }

  return { type: 'unknown' };
}

export function isDashboardPageKey(value: string): value is DashboardPageKey {
  return (DASHBOARD_PAGE_KEYS as readonly string[]).includes(value);
}
