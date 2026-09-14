import { Routes } from '@/constants/routes';
import {
  HUMANER_NAV_COLORS,
  type HumanerNavColor
} from '@/lib/humaner-nav-colors';

export type MailboxFolderId = 'inbox' | 'drafts' | 'archive' | 'tags';

export type MailboxWorkspaceId = 'providers';

export type WorkspaceSectionId = 'tasks' | 'assigned' | 'team' | 'calendar';

export type WorkspaceDrawerId = WorkspaceSectionId | 'resources' | 'companion';

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

export type WorkspaceSectionItem = {
  id: WorkspaceSectionId;
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

/** Collapsible Workspace section — Tasks, Assigned, Team, Calendar. */
export const WORKSPACE_SECTION_ITEMS: WorkspaceSectionItem[] = [
  {
    id: 'tasks',
    label: 'Tasks',
    href: Routes.Tasks,
    color: HUMANER_NAV_COLORS.yellow
  },
  {
    id: 'assigned',
    label: 'Assigned',
    href: Routes.InboxAssigned,
    color: HUMANER_NAV_COLORS.info
  },
  {
    id: 'team',
    label: 'Team',
    href: Routes.OrganizationTeam,
    color: HUMANER_NAV_COLORS.success
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: Routes.Calendar,
    color: HUMANER_NAV_COLORS.warning
  }
];

/** Flat main-nav items outside the Workspace tree. */
export const WORKSPACE_DRAWER_ITEMS: WorkspaceDrawerItem[] = [
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

/** Paths that expand the Workspace nav tree (not Companion / Resources). */
export function isWorkspaceDrawerPath(pathname: string): boolean {
  if (pathname.startsWith(Routes.OrganizationTeam)) return true;
  if (pathname.startsWith(Routes.Tasks) || pathname.startsWith('/tasks')) {
    return true;
  }
  if (pathname.startsWith(Routes.Calendar)) return true;
  if (pathname.startsWith(Routes.InboxAssigned)) return true;
  return false;
}

export function getActiveWorkspaceSectionItem(
  pathname: string
): WorkspaceSectionId | null {
  if (pathname.startsWith(Routes.OrganizationTeam)) return 'team';
  if (pathname.startsWith(Routes.Tasks) || pathname.startsWith('/tasks')) {
    return 'tasks';
  }
  if (pathname.startsWith(Routes.Calendar)) return 'calendar';
  if (pathname.startsWith(Routes.InboxAssigned)) return 'assigned';
  return null;
}

export function getActiveWorkspaceDrawerItem(
  pathname: string
): WorkspaceDrawerId | null {
  const section = getActiveWorkspaceSectionItem(pathname);
  if (section) return section;
  if (
    pathname.startsWith(Routes.Resources) ||
    pathname.startsWith('/resources')
  ) {
    return 'resources';
  }
  if (
    pathname.startsWith(Routes.Knowledge) ||
    pathname.startsWith('/knowledge')
  ) {
    return 'companion';
  }
  return null;
}
