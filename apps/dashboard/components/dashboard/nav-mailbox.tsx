'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CompanionMark } from '@humaner/shared/companion-icon';
import { PlusIcon } from '@humaner/shared/icons';
import { Archive } from '@phosphor-icons/react/dist/ssr/Archive';
import { Books } from '@phosphor-icons/react/dist/ssr/Books';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { ChatCircle } from '@phosphor-icons/react/dist/ssr/ChatCircle';
import { Checks } from '@phosphor-icons/react/dist/ssr/Checks';
import { NotePencil } from '@phosphor-icons/react/dist/ssr/NotePencil';
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { Plugs } from '@phosphor-icons/react/dist/ssr/Plugs';
import { Prohibit } from '@phosphor-icons/react/dist/ssr/Prohibit';
import { SquaresFour } from '@phosphor-icons/react/dist/ssr/SquaresFour';
import { Tag } from '@phosphor-icons/react/dist/ssr/Tag';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { Tray } from '@phosphor-icons/react/dist/ssr/Tray';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';

import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { InboxMailboxMenu } from '@/components/dashboard/inbox-mailbox-menu';
import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import { MailboxNavIcon } from '@/components/dashboard/mailbox-nav-icon';
import { McpNavIcon } from '@/components/dashboard/mcp-nav-icon';
import { SIDEBAR_DRAWER_IDS } from '@/components/dashboard/sidebar-nav-accordion';
import {
  SidebarNavChild,
  SidebarNavLink,
  SidebarNavTree
} from '@/components/dashboard/sidebar-nav-tree';
import { SidebarGroup, useSidebar } from '@/components/ui/sidebar';
import { isInboxLocked } from '@/constants/inbox-nav-items';
import {
  getActiveMailboxFolder,
  getActiveMailboxWorkspace,
  getActiveWorkspaceDrawerItem,
  getActiveWorkspaceSectionItem,
  MAILBOX_FOLDER_ITEMS,
  MAILBOX_WORKSPACE_ITEMS,
  mailboxConnectionHref,
  WORKSPACE_DRAWER_ITEMS,
  WORKSPACE_SECTION_ITEMS,
  type MailboxFolderId,
  type MailboxWorkspaceId,
  type WorkspaceSectionId
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
          ? 'text-[#001afc]'
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
  sent: PaperPlaneTilt,
  archive: Archive,
  spam: Prohibit,
  trash: Trash,
  tags: Tag
};

const WORKSPACE_ICONS: Record<MailboxWorkspaceId, typeof CalendarBlank> = {
  providers: Plugs
};

const SECTION_ICONS: Record<WorkspaceSectionId, typeof CalendarBlank> = {
  tasks: Checks,
  assigned: User,
  team: Users,
  calendar: CalendarBlank
};

export function NavMailbox({
  orgTier,
  unreadCount = 0,
  inboxes = [],
  companionHref = null,
  showCompanionUpgrade = false,
  showMcp = false,
  canManageTeam = true,
  canManageProviders = true
}: {
  orgTier: string;
  unreadCount?: number;
  inboxes?: MailInboxOption[];
  companionHref?: string | null;
  showCompanionUpgrade?: boolean;
  showMcp?: boolean;
  canManageTeam?: boolean;
  canManageProviders?: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const { toggleDock, activeMode } = useDashboardDock();
  const searchParams = useSearchParams();
  const { openCompose } = useComposeMail();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
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
  const activeSection = getActiveWorkspaceSectionItem(pathname);
  const companionActive = activeWorkspaceItem === 'companion';
  const workspaceActive = activeSection !== null;
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

        <SidebarNavTree
          drawerId={SIDEBAR_DRAWER_IDS.workspace}
          label="Workspace"
          active={workspaceActive}
          parentHref={Routes.Tasks}
          mainNavHighlight
          leading={
            <MailboxNavIcon
              icon={SquaresFour}
              active={workspaceActive}
              color={HUMANER_NAV_COLORS.foreground}
            />
          }
        >
          {WORKSPACE_SECTION_ITEMS.filter(
            (item) => item.id !== 'team' || canManageTeam
          ).map((item) => {
            const Icon = SECTION_ICONS[item.id];
            const active = activeSection === item.id;
            return (
              <SidebarNavChild
                key={item.id}
                href={item.href}
                label={item.label}
                active={active}
                disabled={locked && item.id === 'assigned'}
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

        {showCompanionUpgrade ? (
          <Link
            href={Routes.Billing}
            title="Try Companion"
            className={cn(
              'mx-0.5 flex h-8 items-center justify-center gap-2 border border-sidebar-border bg-transparent font-fellix text-xs text-sidebar-foreground/70 transition-colors hover:bg-muted/30 hover:text-sidebar-foreground',
              collapsed
                ? 'w-[calc(100%-0.25rem)] rounded-full px-0'
                : 'rounded-full px-3'
            )}
          >
            <CompanionMark
              size={14}
              className="size-3.5 shrink-0"
            />
            {collapsed ? null : <span>Try Companion</span>}
          </Link>
        ) : companionHref ? (
          <SidebarNavLink
            href={companionHref}
            label="Companion"
            active={companionActive}
            mainNavHighlight
            leading={
              <CompanionMark
                size={16}
                className={cn(
                  'size-4 shrink-0 transition-colors',
                  companionActive
                    ? 'text-[#001afc]'
                    : 'text-sidebar-foreground/50 group-hover/nav:text-sidebar-foreground'
                )}
              />
            }
          />
        ) : null}
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
        {WORKSPACE_DRAWER_ITEMS.map((item) => {
          const active = activeWorkspaceItem === item.id;
          return (
            <SidebarNavLink
              key={item.id}
              href={item.href}
              label={item.label}
              active={active}
              mainNavHighlight
              leading={
                <MailboxNavIcon
                  icon={Books}
                  active={active}
                  color={item.color}
                />
              }
            />
          );
        })}
        {MAILBOX_WORKSPACE_ITEMS.filter(
          (item) => item.id !== 'providers' || canManageProviders
        ).map((item) => {
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
              <McpNavIcon active={pathname.startsWith(Routes.Developers)} />
            }
          />
        ) : null}
      </div>
    </SidebarGroup>
  );
}
