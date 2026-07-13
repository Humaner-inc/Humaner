'use client';

import * as React from 'react';
import { BellIcon, InfoIcon } from '@humaner/shared/icons';

import { AskHumanerTrigger } from '@/components/dashboard/ask-humaner/ask-humaner-trigger';
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
          'sticky top-0 z-30 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-1 border-b border-border/50 bg-background/95 px-4 backdrop-blur-xl sm:px-5',
          className
        )}
      >
        <div aria-hidden />
        <AskHumanerTrigger />
        <div className="col-start-3 flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-9 shrink-0 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            onClick={() => setNotificationsOpen(true)}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
          >
            <BellIcon className="size-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center bg-red-500 font-mono text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            onClick={() => setHelpOpen(true)}
            aria-label="Help"
          >
            <InfoIcon className="size-4" />
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
