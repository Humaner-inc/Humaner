'use client';

import * as React from 'react';
import { BellIcon, InfoIcon } from '@humaner/shared/icons';

import { AskHumanerButton } from '@/components/dashboard/ask-humaner/ask-humaner-button';
import { HelpDrawer } from '@/components/dashboard/help-drawer';
import { NavUser } from '@/components/dashboard/nav-user';
import { NotificationsDrawer } from '@/components/dashboard/notifications-drawer';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useDashboardNotifications } from '@/hooks/use-dashboard-notifications';
import { cn } from '@/lib/utils';
import type { DashboardNotification } from '@/types/dashboard-notification';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type DashboardTopNavProps = {
  profile: ProfileDto;
  notifications: DashboardNotification[];
  className?: string;
};

export function DashboardTopNav({
  profile,
  notifications,
  className
}: DashboardTopNavProps): React.JSX.Element {
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const { visibleNotifications, unreadCount, markSeen, dismissAll } =
    useDashboardNotifications(notifications);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border/50 bg-background px-4 sm:gap-3 sm:px-5',
          className
        )}
      >
        <div
          aria-hidden
          className="min-w-0"
        />
        <div className="justify-self-center">
          <AskHumanerButton />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="relative h-9 shrink-0 gap-1.5 px-2.5 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setNotificationsOpen(true)}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
          >
            <BellIcon className="size-4" />
            <span className="hidden sm:inline">Notifications</span>
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
            <span className="hidden sm:inline">Help</span>
          </Button>
          <ThemeToggle
            variant="ghost"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
          />
          <NavUser
            profile={profile}
            variant="navbar"
          />
        </div>
      </header>

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={visibleNotifications}
        onOpen={markSeen}
        onDismissAll={dismissAll}
      />
      <HelpDrawer
        open={helpOpen}
        onOpenChange={setHelpOpen}
      />
    </>
  );
}
