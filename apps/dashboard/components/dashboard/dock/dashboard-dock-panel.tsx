'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { InfoIcon, MailIcon, XIcon } from '@humaner/shared/icons';
import { assignTrustedNavigation } from '@humaner/shared/urls';

import {
  useDashboardDock,
  type DockMode
} from '@/components/dashboard/dock/dashboard-dock-context';
import { DockNotificationsView } from '@/components/dashboard/dock/dock-notifications-view';
import { DockTeamView } from '@/components/dashboard/dock/dock-team-view';
import { Button } from '@/components/ui/button';
import { GlassFeatureIcon } from '@/components/ui/glass-feature-icon';
import type { TeamWorkspaceFeed } from '@/data/team/get-team-workspace';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { getSupportMailtoUrl } from '@/lib/urls/get-support-email';
import { cn } from '@/lib/utils';

const oss = isOssDeployment();

const DOCK_TITLES: Record<NonNullable<DockMode>, string> = {
  ask: '/companion',
  help: 'Need help?',
  notifications: oss ? 'Notifications' : 'Mail',
  'report-bug': 'Need help?',
  feedback: 'Need help?',
  team: 'Team'
};

function teamDockTitle(workspaceName: string): string {
  const name = workspaceName.trim() || 'Workspace';
  return `${name}'s team`;
}

export function DashboardDockPanel({
  workspaceName,
  teamFeed
}: {
  workspaceName?: string;
  teamFeed?: TeamWorkspaceFeed;
}): React.JSX.Element {
  const { activeMode, closeDock } = useDashboardDock();
  const panelMode = activeMode === 'ask' ? null : activeMode;
  const isOpen = panelMode !== null;
  const title =
    panelMode === 'team'
      ? teamDockTitle(workspaceName ?? '')
      : panelMode
        ? DOCK_TITLES[panelMode]
        : '';

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden border-l border-border/50 transition-[width] duration-300 ease-out',
        isOpen
          ? 'w-96 max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 max-lg:w-full max-lg:border-l-0'
          : 'w-0 border-l-0'
      )}
    >
      {panelMode ? (
        <div className="flex h-full w-96 max-lg:w-full flex-col bg-background">
          <div
            className={cn(
              'flex h-12 shrink-0 items-center gap-2 border-b border-border/50',
              panelMode === 'notifications' ? 'px-5' : 'px-4'
            )}
          >
            <span className="flex-1 truncate font-mono text-xs tracking-tight">
              {title}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={closeDock}
              aria-label="Close panel"
            >
              <XIcon className="size-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <DockContent
              mode={panelMode}
              teamFeed={teamFeed}
            />
          </div>
        </div>
      ) : null}
      <React.Suspense fallback={null}>
        <TeamPanelQueryOpener />
      </React.Suspense>
    </div>
  );
}

function DockContent({
  mode,
  teamFeed
}: {
  mode: Exclude<NonNullable<DockMode>, 'ask'>;
  teamFeed?: TeamWorkspaceFeed;
}): React.JSX.Element {
  switch (mode) {
    case 'notifications':
      return <DockNotificationsView />;
    case 'team':
      return <DockTeamView initialFeed={teamFeed} />;
    case 'help':
    case 'report-bug':
    case 'feedback':
      return <DockHelpView />;
  }
}

function TeamPanelQueryOpener(): null {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { openDock } = useDashboardDock();

  React.useEffect(() => {
    const panel = searchParams.get('panel');
    if (panel === 'team') {
      openDock('team', { teamTab: 'messages' });
      return;
    }
    if (panel === 'notes' || searchParams.get('notes') === '1') {
      const threadId = pathname.match(/\/inbox\/threads\/([^/?#]+)/)?.[1];
      openDock('team', {
        teamTab: 'notes',
        notesFocus: threadId ? { threadId } : null
      });
    }
  }, [openDock, pathname, searchParams]);

  return null;
}

function DockHelpView(): React.JSX.Element {
  return (
    <div className="p-4 space-y-2">
      <p className="mb-4 text-xs text-muted-foreground">
        {oss ? (
          <>Contact your operator about this workspace.</>
        ) : (
          <>
            Reach the team by email.
            <br />
            Human team only behind the scenes.
          </>
        )}
      </p>
      <HelpItem
        icon={MailIcon}
        label="Send an email"
        description="Open your mail client"
        onClick={() => {
          assignTrustedNavigation(
            getSupportMailtoUrl(oss ? 'Support' : 'Humaner support')
          );
        }}
      />
    </div>
  );
}

function HelpItem({
  icon: Icon,
  label,
  description,
  onClick
}: {
  icon: typeof InfoIcon;
  label: string;
  description: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border border-border/60 px-4 py-3 text-left transition-colors',
        dashboardRadiusClassName,
        'hover:bg-muted/50'
      )}
    >
      <GlassFeatureIcon
        size="sm"
        className="shrink-0"
      >
        <Icon strokeWidth={1.25} />
      </GlassFeatureIcon>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
