'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AddressBook } from '@phosphor-icons/react/dist/ssr/AddressBook';
import { Archive } from '@phosphor-icons/react/dist/ssr/Archive';
import { Books } from '@phosphor-icons/react/dist/ssr/Books';
import { CalendarDot } from '@phosphor-icons/react/dist/ssr/CalendarDot';
import { CalendarDots } from '@phosphor-icons/react/dist/ssr/CalendarDots';
import { Checks } from '@phosphor-icons/react/dist/ssr/Checks';
import { Columns } from '@phosphor-icons/react/dist/ssr/Columns';
import { Envelope } from '@phosphor-icons/react/dist/ssr/Envelope';
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear';
import { Globe } from '@phosphor-icons/react/dist/ssr/Globe';
import { NotePencil } from '@phosphor-icons/react/dist/ssr/NotePencil';
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { Plugs } from '@phosphor-icons/react/dist/ssr/Plugs';
import { Prohibit } from '@phosphor-icons/react/dist/ssr/Prohibit';
import { Tag } from '@phosphor-icons/react/dist/ssr/Tag';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';

import { useDashboardSection } from '@/components/dashboard/dashboard-section-context';
import { InboxMailboxMenu } from '@/components/dashboard/inbox-mailbox-menu';
import { MailboxNavIcon } from '@/components/dashboard/mailbox-nav-icon';
import { McpNavIcon } from '@/components/dashboard/mcp-nav-icon';
import {
  NavConnectors,
  type ConnectorNavItem
} from '@/components/dashboard/nav-connectors';
import { SidebarNavLink } from '@/components/dashboard/sidebar-nav-tree';
import { useSidebar } from '@/components/ui/sidebar';
import {
  DASHBOARD_SECTIONS,
  type DashboardSectionId
} from '@/constants/dashboard-sections';
import { isInboxLocked } from '@/constants/inbox-nav-items';
import {
  getActiveMailboxFolder,
  getActiveMailboxWorkspace,
  getActiveWorkspaceSectionItem,
  MAILBOX_FOLDER_ITEMS,
  mailboxConnectionHref,
  WORKSPACE_SECTION_ITEMS,
  type MailboxFolderId,
  type WorkspaceSectionId
} from '@/constants/mailbox-nav-items';
import { Routes } from '@/constants/routes';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import {
  CALENDAR_VIEWS,
  parseCalendarView
} from '@/lib/calendar/calendar-view';
import { HUMANER_NAV_COLORS } from '@/lib/humaner-nav-colors';
import { groupMailInboxes } from '@/lib/inbox/mail-inbox-groups';
import { cn } from '@/lib/utils';

const FOLDER_ICONS: Record<MailboxFolderId, typeof Envelope> = {
  inbox: Envelope,
  drafts: NotePencil,
  sent: PaperPlaneTilt,
  archive: Archive,
  spam: Prohibit,
  trash: Trash,
  tags: Tag
};

const WORKSPACE_ICONS: Record<WorkspaceSectionId, typeof Checks> = {
  tasks: Checks,
  assigned: User,
  team: Users,
  resources: Books,
  settings: Gear
};

const CALENDAR_VIEW_META: Record<
  (typeof CALENDAR_VIEWS)[number],
  { label: string; icon: typeof Columns }
> = {
  day: { label: 'Day', icon: CalendarDot },
  week: { label: 'Week', icon: Columns },
  month: { label: 'Month', icon: CalendarDots }
};

function useIconRail(): boolean {
  return useSidebar().state === 'collapsed';
}

function formatCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

function CountBadge({
  count,
  active
}: {
  count: number;
  active: boolean;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'shrink-0 font-mono text-[10px] leading-none tabular-nums',
        active
          ? 'text-[#001afc] dark:text-sidebar-foreground'
          : 'text-sidebar-foreground/45'
      )}
      aria-label={`${count} unread`}
    >
      {formatCount(count)}
    </span>
  );
}

/** Linear-style panel header: section name. Compose lives in the top bar. */
function SectionHeader({ id }: { id: DashboardSectionId }): React.JSX.Element {
  const iconRail = useIconRail();
  const section = DASHBOARD_SECTIONS.find((item) => item.id === id);
  const label = section?.label ?? id;

  if (iconRail) {
    return <></>;
  }

  return (
    // pr-9 leaves the panel's corner to the reduce / extend toggle.
    <div className="flex h-9 items-center gap-2 pb-2 pl-3 pr-9">
      <h2 className="min-w-0 flex-1 truncate font-fellix text-[13px] font-medium text-sidebar-foreground">
        {label}
      </h2>
    </div>
  );
}

/** Short hairline between groups — replaces mono eyebrows. */
function SectionDivider(): React.JSX.Element {
  return (
    <div
      role="separator"
      aria-hidden
      className="mx-3 my-2 h-px bg-sidebar-foreground/[0.08] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-4"
    />
  );
}

function SectionGroup({
  divided = false,
  children,
  className
}: {
  divided?: boolean;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn('space-y-px', className)}>
      {divided ? <SectionDivider /> : null}
      {children}
    </div>
  );
}

function OverviewSection(): React.JSX.Element {
  const pathname = usePathname();
  const overviewActive = pathname.startsWith(Routes.Overview);
  const contactsActive = pathname.startsWith(Routes.Contacts);

  return (
    <>
      <SectionHeader id="overview" />
      <SectionGroup>
        <SidebarNavLink
          href={Routes.Overview}
          label="Overview"
          active={overviewActive}
          mainNavHighlight
          leading={
            <MailboxNavIcon
              icon={Globe}
              active={overviewActive}
              color={HUMANER_NAV_COLORS.info}
            />
          }
        />
        <SidebarNavLink
          href={Routes.Contacts}
          label="Contacts"
          active={contactsActive}
          mainNavHighlight
          leading={
            <MailboxNavIcon
              icon={AddressBook}
              active={contactsActive}
              color={HUMANER_NAV_COLORS.success}
            />
          }
        />
      </SectionGroup>
    </>
  );
}

function CalendarSection(): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onCalendar = pathname.startsWith(Routes.Calendar);
  const activeView = parseCalendarView(searchParams.get('view'));

  const hrefForView = (view: string): string => {
    const params = new URLSearchParams(
      onCalendar ? searchParams.toString() : ''
    );
    params.set('view', view);
    params.delete('event');
    return `${Routes.Calendar}?${params.toString()}`;
  };

  return (
    <>
      <SectionHeader id="calendar" />
      <SectionGroup divided>
        {CALENDAR_VIEWS.map((view) => {
          const meta = CALENDAR_VIEW_META[view];
          const active = onCalendar && activeView === view;
          return (
            <SidebarNavLink
              key={view}
              href={hrefForView(view)}
              label={meta.label}
              active={active}
              mainNavHighlight
              leading={
                <MailboxNavIcon
                  icon={meta.icon}
                  active={active}
                  color={HUMANER_NAV_COLORS.warning}
                />
              }
            />
          );
        })}
      </SectionGroup>
    </>
  );
}

function InboxSection({
  orgTier,
  unreadCount,
  inboxes
}: {
  orgTier: string;
  unreadCount: number;
  inboxes: MailInboxOption[];
}): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locked = isInboxLocked(orgTier);
  const mailboxes = React.useMemo(() => groupMailInboxes(inboxes), [inboxes]);
  const mailboxParam = searchParams.get('mailbox');
  const activeMailbox =
    mailboxes.find((mailbox) => mailbox.connectionId === mailboxParam) ??
    mailboxes[0] ??
    null;
  const activeMailboxId = activeMailbox?.connectionId ?? null;
  const activeFolder = getActiveMailboxFolder(pathname);
  const unread = activeMailbox?.unreadCount ?? unreadCount;
  const mailboxConnected = mailboxes.length > 0;

  return (
    <>
      <SectionHeader id="inbox" />
      {mailboxes.length > 1 ? (
        <div className="pb-2">
          <InboxMailboxMenu
            mailboxes={mailboxes}
            activeMailboxId={activeMailboxId}
            activeFolder={activeFolder}
            locked={locked}
          />
        </div>
      ) : null}
      <SectionGroup>
        {MAILBOX_FOLDER_ITEMS.map((item) => {
          const Icon = FOLDER_ICONS[item.id];
          const active = activeFolder === item.id;
          const showUnread =
            item.id === 'inbox' && mailboxConnected && !locked && unread > 0;
          return (
            <SidebarNavLink
              key={item.id}
              href={mailboxConnectionHref(item.href, activeMailboxId)}
              label={item.label}
              active={active}
              disabled={locked}
              mainNavHighlight
              badge={
                showUnread ? (
                  <CountBadge
                    count={unread}
                    active={active}
                  />
                ) : undefined
              }
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
      </SectionGroup>
    </>
  );
}

function WorkspaceSection({
  orgTier,
  canManageTeam
}: {
  orgTier: string;
  canManageTeam: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const locked = isInboxLocked(orgTier);
  const activeSection = getActiveWorkspaceSectionItem(pathname);

  return (
    <>
      <SectionHeader id="workspace" />
      <SectionGroup>
        {WORKSPACE_SECTION_ITEMS.filter(
          (item) => item.id !== 'team' || canManageTeam
        ).map((item) => {
          const Icon = WORKSPACE_ICONS[item.id];
          const active = activeSection === item.id;
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
      </SectionGroup>
    </>
  );
}

function UtilitiesSection({
  orgTier,
  connectors,
  showMcp,
  canManageProviders
}: {
  orgTier: string;
  connectors: ConnectorNavItem[];
  showMcp: boolean;
  canManageProviders: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const locked = isInboxLocked(orgTier);
  const providersActive = getActiveMailboxWorkspace(pathname) === 'providers';
  const mcpActive = pathname.startsWith(Routes.Developers);

  return (
    <>
      <SectionHeader id="utilities" />
      <SectionGroup>
        {showMcp ? (
          <SidebarNavLink
            href={Routes.Developers}
            label="MCP"
            active={mcpActive}
            mainNavHighlight
            leading={<McpNavIcon active={mcpActive} />}
          />
        ) : null}
        {canManageProviders ? (
          <SidebarNavLink
            href={Routes.InboxProviders}
            label="Providers"
            active={providersActive}
            disabled={locked}
            mainNavHighlight
            leading={
              <MailboxNavIcon
                icon={Plugs}
                active={providersActive}
                color={HUMANER_NAV_COLORS.foreground}
              />
            }
          />
        ) : null}
      </SectionGroup>
      {connectors.length > 0 ? (
        <SectionGroup divided>
          <NavConnectors connectors={connectors} />
        </SectionGroup>
      ) : null}
    </>
  );
}

export type NavSectionSidebarProps = {
  orgTier: string;
  unreadCount?: number;
  inboxes?: MailInboxOption[];
  showMcp?: boolean;
  canManageTeam?: boolean;
  canManageProviders?: boolean;
  connectors?: ConnectorNavItem[];
};

/** Sidebar body for the section picked in the top bar. */
export function NavSectionSidebar({
  orgTier,
  unreadCount = 0,
  inboxes = [],
  showMcp = false,
  canManageTeam = true,
  canManageProviders = true,
  connectors = []
}: NavSectionSidebarProps): React.JSX.Element {
  const { activeSection } = useDashboardSection();

  return (
    <div
      key={activeSection}
      className="animate-in fade-in-0 slide-in-from-left-1 duration-200"
    >
      {activeSection === 'overview' ? <OverviewSection /> : null}
      {activeSection === 'calendar' ? <CalendarSection /> : null}
      {activeSection === 'inbox' ? (
        <InboxSection
          orgTier={orgTier}
          unreadCount={unreadCount}
          inboxes={inboxes}
        />
      ) : null}
      {activeSection === 'workspace' ? (
        <WorkspaceSection
          orgTier={orgTier}
          canManageTeam={canManageTeam}
        />
      ) : null}
      {activeSection === 'utilities' ? (
        <UtilitiesSection
          orgTier={orgTier}
          connectors={connectors}
          showMcp={showMcp}
          canManageProviders={canManageProviders}
        />
      ) : null}
    </div>
  );
}
