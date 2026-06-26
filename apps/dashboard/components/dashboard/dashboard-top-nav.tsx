'use client';

import { BellIcon, InfoIcon } from '@humaner/shared/icons';
import * as React from 'react';

import { HelpDrawer } from '@/components/dashboard/help-drawer';
import { NotificationsDrawer } from '@/components/dashboard/notifications-drawer';
import { WorkspaceSwitcher } from '@/components/dashboard/workspace/workspace-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { cn } from '@/lib/utils';
import type { DashboardNotification } from '@/types/dashboard-notification';

export type DashboardTopNavProps = {
  workspaces: UserWorkspaceSummary[];
  notifications: DashboardNotification[];
  className?: string;
};

export function DashboardTopNav({
  workspaces,
  notifications,
  className
}: DashboardTopNavProps): React.JSX.Element {
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const unreadCount = notifications.length;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border/50 bg-background px-4 sm:px-6',
          className
        )}
      >
        <div aria-hidden="true" />
        <WorkspaceSwitcher
          variant="navbar"
          workspaces={workspaces}
        />
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="relative h-9 shrink-0 gap-1.5 px-2.5 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setNotificationsOpen(true)}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} items`
                : 'Notifications'
            }
          >
            <BellIcon className="size-4" />
            Notifications
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 shrink-0 gap-1.5 px-2.5 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setHelpOpen(true)}
          >
            <InfoIcon className="size-4" />
            Help
          </Button>
          <ThemeToggle
            variant="ghost"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
          />
        </div>
      </header>

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
      />
      <HelpDrawer
        open={helpOpen}
        onOpenChange={setHelpOpen}
      />
    </>
  );
}
