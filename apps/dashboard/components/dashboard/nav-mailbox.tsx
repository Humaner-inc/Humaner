'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PlusIcon } from '@humaner/shared/icons';
import { Archive } from '@phosphor-icons/react/dist/ssr/Archive';
import { Books } from '@phosphor-icons/react/dist/ssr/Books';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { ChatCircle } from '@phosphor-icons/react/dist/ssr/ChatCircle';
import { Checks } from '@phosphor-icons/react/dist/ssr/Checks';
import { Code } from '@phosphor-icons/react/dist/ssr/Code';
import { NotePencil } from '@phosphor-icons/react/dist/ssr/NotePencil';
import { Plugs } from '@phosphor-icons/react/dist/ssr/Plugs';
import { Tag } from '@phosphor-icons/react/dist/ssr/Tag';
import { Tray } from '@phosphor-icons/react/dist/ssr/Tray';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';

import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { InboxMailboxMenu } from '@/components/dashboard/inbox-mailbox-menu';
import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import { MailboxNavIcon } from '@/components/dashboard/mailbox-nav-icon';
import { SIDEBAR_DRAWER_IDS } from '@/components/dashboard/sidebar-nav-accordion';
import {
  SidebarNavChild,
  SidebarNavLink,
  SidebarNavTree
} from '@/components/dashboard/sidebar-nav-tree';
import { SidebarGroup } from '@/components/ui/sidebar';
import { isInboxLocked } from '@/constants/inbox-nav-items';
import {
  getActiveMailboxFolder,
  getActiveMailboxWorkspace,
  getActiveWorkspaceDrawerItem,
  MAILBOX_FOLDER_ITEMS,
  MAILBOX_WORKSPACE_ITEMS,
  mailboxConnectionHref,
  WORKSPACE_DRAWER_ITEMS,
  type MailboxFolderId,
  type MailboxWorkspaceId,
  type WorkspaceDrawerId
} from '@/constants/mailbox-nav-items';
import { Routes } from '@/constants/routes';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { HUMANER_NAV_COLORS } from '@/lib/humaner-nav-colors';
import {
  groupMailInboxes,
  primaryAliasForMailbox
} from '@/lib/inbox/mail-inbox-groups';
import { cn } from '@/lib/utils';

function formatInboxCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

function InboxCountIcon({
  count,
  active
}: {
  count: number;
  active: boolean;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'flex h-4 min-w-4 shrink-0 items-center justify-center font-mono text-[10px] leading-none tabular-nums',
        active
          ? 'text-[#2252bc]'
          : 'text-sidebar-foreground/50 group-hover/nav:text-sidebar-foreground'
      )}
      aria-label={`${count} unread`}
    >
      {formatInboxCount(count)}
    </span>
  );
}

const FOLDER_ICONS: Record<MailboxFolderId, typeof Tray> = {
  inbox: Tray,
  drafts: NotePencil,
  archive: Archive,
  tags: Tag
};

const WORKSPACE_ICONS: Record<MailboxWorkspaceId, typeof CalendarBlank> = {
  providers: Plugs
};

const MAIN_ICONS: Record<WorkspaceDrawerId, typeof CalendarBlank> = {
  team: Users,
  tasks: Checks,
  calendar: CalendarBlank,
  assigned: User,
  resources: Books,
  companion: ChatCircle
};

export function NavMailbox({
  orgTier,
  unreadCount = 0,
  inboxes = [],
  companionHref: _companionHref,
  showMcp = false
}: {
  orgTier: string;
  unreadCount?: number;
  inboxes?: MailInboxOption[];
  companionHref?: string | null;
  showMcp?: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const { toggleDock, activeMode } = useDashboardDock();
  const searchParams = useSearchParams();
  const { openCompose } = useComposeMail();
  const locked = isInboxLocked(orgTier);
  const mailboxes = React.useMemo(() => groupMailInboxes(inboxes), [inboxes]);
  const mailboxParam = searchParams.get('mailbox');
  const activeMailbox =
    mailboxes.find((mailbox) => mailbox.connectionId === mailboxParam) ??
    mailboxes[0] ??
    null;
  const activeMailboxId = activeMailbox?.connectionId ?? null;
  const activeFolder = getActiveMailboxFolder(pathname);
  const activeWorkspace = getActiveMailboxWorkspace(pathname);
  const activeWorkspaceItem = getActiveWorkspaceDrawerItem(pathname);
  const inboxActive = activeFolder !== null;
  const composeAliasId = primaryAliasForMailbox(inboxes, activeMailboxId);
  const hasMultipleInboxes = mailboxes.length > 1;
  const mailboxConnected = mailboxes.length > 0;
  const inboxHref = mailboxConnectionHref(Routes.InboxAll, activeMailboxId);
  const unread = activeMailbox?.unreadCount ?? unreadCount;
  const inboxFolders = MAILBOX_FOLDER_ITEMS.filter(
    (item) => item.id !== 'inbox'
  );

  const openNewMessage = (): void => {
    if (composeAliasId) openCompose(composeAliasId);
    else openCompose();
  };

  return (
    <SidebarGroup className="p-0">
      <div className="space-y-0.5">
        <SidebarNavTree
          drawerId={SIDEBAR_DRAWER_IDS.inbox}
          label="Inbox"
          active={inboxActive}
          parentHref={inboxHref}
          mainNavHighlight
          leading={
            mailboxConnected && !locked && unread > 0 ? (
              <InboxCountIcon
                count={unread}
                active={inboxActive}
              />
            ) : (
              <MailboxNavIcon
                icon={Tray}
                active={inboxActive}
                color={HUMANER_NAV_COLORS.info}
              />
            )
          }
          quickAction={
            locked
              ? undefined
              : {
                  label: 'New message',
                  icon: <PlusIcon className="size-3.5" />,
                  onClick: openNewMessage
                }
          }
        >
          {hasMultipleInboxes ? (
            <InboxMailboxMenu
              mailboxes={mailboxes}
              activeMailboxId={activeMailboxId}
              activeFolder={activeFolder}
              locked={locked}
            />
          ) : null}
          {inboxFolders.map((item) => {
            const Icon = FOLDER_ICONS[item.id];
            const active = activeFolder === item.id;
            return (
              <SidebarNavChild
                key={item.id}
                href={mailboxConnectionHref(item.href, activeMailboxId)}
                label={item.label}
                active={active}
                disabled={locked}
                leading={
                  <MailboxNavIcon
                    icon={Icon}
                    active={active}
                    color={item.color}
                  />
                }
              />
            );
          })}
        </SidebarNavTree>

        {WORKSPACE_DRAWER_ITEMS.map((item) => {
          const Icon = MAIN_ICONS[item.id];
          const active = activeWorkspaceItem === item.id;
          return (
            <SidebarNavLink
              key={item.id}
              href={item.href}
              label={item.label}
              active={active}
              disabled={locked && item.id === 'assigned'}
              mainNavHighlight
              leading={
                <MailboxNavIcon
                  icon={Icon}
                  active={active}
                  color={item.color}
                />
              }
            />
          );
        })}
        <SidebarNavLink
          href="#team"
          label="Messages"
          active={activeMode === 'team'}
          mainNavHighlight
          onClick={() => toggleDock('team', { teamTab: 'messages' })}
          leading={
            <MailboxNavIcon
              icon={ChatCircle}
              active={activeMode === 'team'}
              color={HUMANER_NAV_COLORS.info}
            />
          }
        />
        {MAILBOX_WORKSPACE_ITEMS.map((item) => {
          const Icon = WORKSPACE_ICONS[item.id];
          const active = activeWorkspace === item.id;
          return (
            <SidebarNavLink
              key={item.id}
              href={item.href}
              label={item.label}
              active={active}
              disabled={locked && item.id === 'providers'}
              mainNavHighlight
              leading={
                <MailboxNavIcon
                  icon={Icon}
                  active={active}
                  color={item.color}
                />
              }
            />
          );
        })}
        {showMcp ? (
          <SidebarNavLink
            href={Routes.Developers}
            label="MCP"
            active={pathname.startsWith(Routes.Developers)}
            mainNavHighlight
            leading={
              <MailboxNavIcon
                icon={Code}
                active={pathname.startsWith(Routes.Developers)}
                color={HUMANER_NAV_COLORS.foreground}
              />
            }
          />
        ) : null}
      </div>
    </SidebarGroup>
  );
}
