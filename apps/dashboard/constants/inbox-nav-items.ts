import type { LucideIcon } from '@humaner/shared/icons';
import { getPlanForTier } from '@humaner/shared/plans';

import { Routes } from '@/constants/routes';

export type InboxNavTabId =
  | 'all'
  | 'assigned'
  | 'archive'
  | 'aliases'
  | 'providers'
  | 'tags';

export type InboxNavTab = {
  id: InboxNavTabId;
  label: string;
  href: string;
  icon?: LucideIcon;
};

export const INBOX_NAV_TABS: InboxNavTab[] = [
  {
    id: 'all',
    label: 'Inbox',
    href: Routes.InboxAll
  },
  {
    id: 'assigned',
    label: 'Assigned to me',
    href: Routes.InboxAssigned
  },
  {
    id: 'archive',
    label: 'Archive',
    href: Routes.InboxArchive
  },
  {
    id: 'aliases',
    label: 'Aliases',
    href: Routes.InboxSettings
  },
  {
    id: 'providers',
    label: 'Providers',
    href: Routes.InboxProviders
  },
  {
    id: 'tags',
    label: 'Tags',
    href: Routes.InboxTags
  }
];

export function getActiveInboxTab(pathname: string): InboxNavTabId | null {
  if (pathname.startsWith(Routes.InboxAssigned)) return 'assigned';
  if (pathname.startsWith(Routes.InboxArchive)) return 'archive';
  if (
    pathname.startsWith(Routes.InboxAliases) ||
    pathname.startsWith(Routes.InboxSettings)
  ) {
    return 'aliases';
  }
  if (pathname.startsWith(Routes.InboxProviders)) return 'providers';
  if (pathname.startsWith(Routes.InboxTags)) return 'tags';
  if (
    pathname === Routes.Inbox ||
    pathname.startsWith(Routes.InboxAll) ||
    pathname.startsWith('/inbox/threads')
  ) {
    return 'all';
  }
  return null;
}

export function isInboxPath(pathname: string): boolean {
  return pathname === Routes.Inbox || pathname.startsWith(`${Routes.Inbox}/`);
}

export function isInboxLocked(orgTier: string): boolean {
  return getPlanForTier(orgTier).mailboxAliases <= 0;
}

export function inboxThreadRoute(threadId: string): string {
  return `/inbox/threads/${threadId}`;
}
