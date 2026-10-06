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

export type TeammateAccessLevel = 'admin' | 'member';

/** Full workspace access: team, settings, providers, and every mailbox. */
export const ADMIN_PAGE_ACCESS: DashboardPageKey[] = [...DASHBOARD_PAGE_KEYS];

/** Mailbox work only — no team management, workspace settings, or providers. */
export const MEMBER_PAGE_ACCESS: DashboardPageKey[] = [
  'history',
  'inbox',
  'tasks',
  'calendar',
  'desk',
  'human-desk'
];

export const DEFAULT_TEAMMATE_PAGE_ACCESS: DashboardPageKey[] = [
  ...MEMBER_PAGE_ACCESS
];

const ADMIN_ONLY_PAGE_KEYS = new Set<DashboardPageKey>([
  'overview',
  'agents',
  'integrations',
  'settings'
]);

export function resolveTeammateAccessLevel(
  pages: readonly string[]
): TeammateAccessLevel {
  return pages.some((page) =>
    ADMIN_ONLY_PAGE_KEYS.has(page as DashboardPageKey)
  )
    ? 'admin'
    : 'member';
}

export function pagesForTeammateAccess(
  level: TeammateAccessLevel
): DashboardPageKey[] {
  return level === 'admin' ? [...ADMIN_PAGE_ACCESS] : [...MEMBER_PAGE_ACCESS];
}

/** Empty list means every enabled inbox. Admins always get every inbox. */
export function storedAllowedAliasIds(input: {
  pages: readonly string[];
  selectedAliasIds: readonly string[];
  channelIds: readonly string[];
}): string[] {
  if (!input.pages.includes('inbox') || input.channelIds.length === 0) {
    return [];
  }
  if (resolveTeammateAccessLevel(input.pages) === 'admin') {
    return [];
  }
  const allowed = new Set(input.channelIds);
  const selected = input.selectedAliasIds.filter((id) => allowed.has(id));
  if (selected.length === 0 || selected.length === input.channelIds.length) {
    return [];
  }
  return selected;
}

export const OWNER_ONLY_ROUTE_PREFIXES = [
  Routes.OrganizationInformation,
  Routes.Billing,
  Routes.Developers,
  Routes.AuditLogs
] as const;

export const ACCOUNT_ROUTE_PREFIXES = [
  Routes.Profile,
  Routes.Security,
  Routes.Notifications,
  Routes.Contacts
] as const;

const PAGE_KEY_ROUTE_PREFIXES: { key: DashboardPageKey; prefix: string }[] = [
  { key: 'overview', prefix: Routes.Home },
  { key: 'overview', prefix: Routes.OrganizationTeam },
  { key: 'integrations', prefix: Routes.Integrations },
  { key: 'history', prefix: Routes.History },
  { key: 'inbox', prefix: Routes.Inbox },
  { key: 'inbox', prefix: Routes.Outbound },
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
  | { type: 'workspace-admin' }
  | { type: 'account' }
  | { type: 'platform-admin' }
  | { type: 'page'; pageKey: DashboardPageKey }
  | { type: 'unknown' };

export function resolvePathAccess(pathname: string): ResolvedPathAccess {
  const path = toPublicPathname(pathname);

  if (path.startsWith('/admin')) {
    return { type: 'platform-admin' };
  }

  if (
    path.startsWith(Routes.InboxProviders) ||
    path.startsWith(Routes.InboxSettings) ||
    path.startsWith(Routes.InboxAliases) ||
    path.startsWith(Routes.OrganizationWorkspace)
  ) {
    return { type: 'workspace-admin' };
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
