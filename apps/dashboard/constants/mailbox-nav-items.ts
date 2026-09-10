import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import {
  HUMANER_NAV_COLORS,
  type HumanerNavColor
} from '@/lib/humaner-nav-colors';

export type MailboxFolderId = 'inbox' | 'drafts' | 'archive' | 'tags';

export type MailboxWorkspaceId = 'providers';

export type WorkspaceDrawerId =
  | 'team'
  | 'tasks'
  | 'calendar'
  | 'assigned'
  | 'resources'
  | 'companion';

export type MailboxFolderItem = {
  id: MailboxFolderId;
  label: string;
  href: string;
  color: HumanerNavColor;
};

export type MailboxWorkspaceItem = {
  id: MailboxWorkspaceId;
  label: string;
  href: string;
  color: HumanerNavColor;
};

export type WorkspaceDrawerItem = {
  id: WorkspaceDrawerId;
  label: string;
  href: string;
  color: HumanerNavColor;
};

export const MAILBOX_FOLDER_ITEMS: MailboxFolderItem[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    href: Routes.InboxAll,
    color: HUMANER_NAV_COLORS.info
  },
  {
    id: 'drafts',
    label: 'Drafts',
    href: Routes.InboxDrafts,
    color: HUMANER_NAV_COLORS.warning
  },
  {
    id: 'archive',
    label: 'Archive',
    href: Routes.InboxArchive,
    color: HUMANER_NAV_COLORS.foreground
  },
  {
    id: 'tags',
    label: 'Tags',
    href: Routes.InboxTags,
    color: HUMANER_NAV_COLORS.success
  }
];

export const MAILBOX_WORKSPACE_ITEMS: MailboxWorkspaceItem[] = [
  {
    id: 'providers',
    label: 'Providers',
    href: Routes.InboxProviders,
    color: HUMANER_NAV_COLORS.foreground
  }
];

export const WORKSPACE_DRAWER_ITEMS: WorkspaceDrawerItem[] = [
  {
    id: 'team',
    label: 'Team',
    href: Routes.OrganizationTeam,
    color: HUMANER_NAV_COLORS.success
  },
  {
    id: 'tasks',
    label: 'Tasks',
    href: Routes.Tasks,
    color: HUMANER_NAV_COLORS.yellow
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: Routes.Calendar,
    color: HUMANER_NAV_COLORS.warning
  },
  {
    id: 'assigned',
    label: 'Assigned',
    href: Routes.InboxAssigned,
    color: HUMANER_NAV_COLORS.info
  },
  {
    id: 'resources',
    label: 'Resources',
    href: Routes.Resources,
    color: HUMANER_NAV_COLORS.info
  }
];

export function mailboxConnectionHref(
  path: string,
  connectionId: string | null
): string {
  if (!connectionId) return path;
  return `${path}?mailbox=${encodeURIComponent(connectionId)}`;
}

export function mailboxAliasHref(aliasId: string): string {
  return `${Routes.InboxAll}?alias=${encodeURIComponent(aliasId)}`;
}

export function isPerInboxMailboxPath(pathname: string): boolean {
  if (pathname.startsWith(Routes.InboxDrafts)) return true;
  if (pathname.startsWith(Routes.InboxArchive)) return true;
  if (pathname.startsWith(Routes.InboxTags)) return true;
  if (pathname.startsWith('/inbox/threads')) return true;
  if (pathname === Routes.Inbox || pathname.startsWith(Routes.InboxAll)) {
    return true;
  }
  return false;
}

export function getActiveMailboxFolder(
  pathname: string
): MailboxFolderId | null {
  if (pathname.startsWith(Routes.InboxDrafts)) return 'drafts';
  if (pathname.startsWith(Routes.InboxArchive)) return 'archive';
  if (pathname.startsWith(Routes.InboxTags)) return 'tags';
  if (
    pathname === Routes.Inbox ||
    pathname.startsWith(Routes.InboxAll) ||
    pathname.startsWith('/inbox/threads')
  ) {
    return 'inbox';
  }
  return null;
}

export function getActiveMailboxWorkspace(
  pathname: string
): MailboxWorkspaceId | null {
  if (pathname.startsWith(Routes.InboxProviders)) return 'providers';
  return null;
}

export function isWorkspaceDrawerPath(pathname: string): boolean {
  if (pathname.startsWith(Routes.OrganizationWorkspace)) return true;
  if (pathname.startsWith(Routes.OrganizationTeam)) return true;
  if (pathname.startsWith(Routes.Tasks) || pathname.startsWith('/tasks')) {
    return true;
  }
  if (
    pathname.startsWith(Routes.Resources) ||
    pathname.startsWith('/resources')
  ) {
    return true;
  }
  if (pathname.startsWith(Routes.Calendar)) return true;
  if (pathname.startsWith(Routes.InboxAssigned)) return true;
  if (!isOssDeployment() && /^\/agents\/(?!new(?:\/|$))[^/]+/.test(pathname)) {
    return true;
  }
  return false;
}

export function getActiveWorkspaceDrawerItem(
  pathname: string
): WorkspaceDrawerId | null {
  if (pathname.startsWith(Routes.OrganizationTeam)) return 'team';
  if (pathname.startsWith(Routes.Tasks) || pathname.startsWith('/tasks')) {
    return 'tasks';
  }
  if (pathname.startsWith(Routes.Calendar)) return 'calendar';
  if (pathname.startsWith(Routes.InboxAssigned)) return 'assigned';
  if (
    pathname.startsWith(Routes.Resources) ||
    pathname.startsWith('/resources')
  ) {
    return 'resources';
  }
  if (!isOssDeployment() && /^\/agents\/(?!new(?:\/|$))[^/]+/.test(pathname)) {
    return 'companion';
  }
  return null;
}

export type MailboxPrimaryId =
  | 'inbox'
  | 'tasks'
  | 'calendar'
  | 'drafts'
  | 'assigned'
  | 'archive';

export type MailboxPrimaryItem = {
  id: MailboxPrimaryId;
  label: string;
  href: string;
};

/** @deprecated Use MAILBOX_FOLDER_ITEMS / MAILBOX_WORKSPACE_ITEMS. */
export const MAILBOX_PRIMARY_ITEMS: MailboxPrimaryItem[] = [
  { id: 'inbox', label: 'Inbox', href: Routes.InboxAll },
  { id: 'tasks', label: 'Tasks', href: Routes.Tasks },
  { id: 'calendar', label: 'Calendar', href: Routes.Calendar },
  { id: 'drafts', label: 'Drafts', href: Routes.InboxDrafts },
  { id: 'assigned', label: 'Assigned', href: Routes.InboxAssigned },
  { id: 'archive', label: 'Archive', href: Routes.InboxArchive }
];

export function getActiveMailboxPrimary(
  pathname: string
): MailboxPrimaryId | null {
  if (pathname.startsWith(Routes.Tasks) || pathname.startsWith('/tasks')) {
    return 'tasks';
  }
  if (pathname.startsWith(Routes.Calendar)) return 'calendar';
  if (pathname.startsWith(Routes.InboxDrafts)) return 'drafts';
  if (pathname.startsWith(Routes.InboxAssigned)) return 'assigned';
  if (pathname.startsWith(Routes.InboxArchive)) return 'archive';
  if (
    pathname === Routes.Inbox ||
    pathname.startsWith(Routes.InboxAll) ||
    pathname.startsWith('/inbox/threads')
  ) {
    return 'inbox';
  }
  return null;
}
