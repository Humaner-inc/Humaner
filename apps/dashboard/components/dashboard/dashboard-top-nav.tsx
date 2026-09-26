'use client';

import * as React from 'react';
import { BellIcon, InfoIcon, MessageCircleIcon } from '@humaner/shared/icons';

import { DashboardMobileNavTitle } from '@/components/dashboard/dashboard-mobile-nav-title';
import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { useDockNotifications } from '@/components/dashboard/dock/dock-notifications-context';
import { NavUser } from '@/components/dashboard/nav-user';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTeamUnreadCount } from '@/hooks/use-team-unread-count';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

const oss = isOssDeployment();

export type DashboardTopNavProps = {
  profile: ProfileDto;
  planName: string;
  audienceLabel: string | null;
  teamFeed?: {
    messages: Array<{ authorId: string; createdAt: string }>;
    notes: Array<{ authorId: string; createdAt: string; body: string }>;
  };
  className?: string;
};

export function DashboardTopNav({
  profile,
  planName,
  audienceLabel,
  teamFeed,
  className
}: DashboardTopNavProps): React.JSX.Element {
  const { toggleDock, activeMode } = useDashboardDock();
  const { unreadCount } = useDockNotifications();
  const teamUnreadCount = useTeamUnreadCount({
    userId: profile.id,
    userName: profile.name,
    messages: teamFeed?.messages ?? [],
    notes: teamFeed?.notes ?? [],
    teamDockOpen: activeMode === 'team'
  });
  const mailLabel = oss ? 'Notifications' : 'Mail';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur-xl sm:px-5',
        className
      )}
    >
      <DashboardMobileNavTitle />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'relative size-9 shrink-0 rounded-lg hover:bg-muted/60',
          activeMode === 'team'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => toggleDock('team', { teamTab: 'messages' })}
        aria-pressed={activeMode === 'team'}
        aria-label={
          teamUnreadCount > 0
            ? `Team, ${teamUnreadCount} unread`
            : 'Team messages'
        }
        title="Team"
      >
        <MessageCircleIcon className="size-4" />
        {teamUnreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] text-white">
            {teamUnreadCount > 9 ? '9+' : teamUnreadCount}
          </span>
        ) : null}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative size-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        onClick={() => toggleDock('notifications')}
        aria-label={
          unreadCount > 0 ? `${mailLabel}, ${unreadCount} unread` : mailLabel
        }
      >
        <BellIcon className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        onClick={() => toggleDock('help')}
        aria-label="Help"
      >
        <InfoIcon className="size-4" />
      </Button>
      <ThemeToggle
        variant="ghost"
        className="size-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
      />
      <div className="flex h-7 items-center gap-1.5">
        <NavUser
          profile={profile}
          planName={planName}
          audienceLabel={audienceLabel}
        />
      </div>
    </header>
  );
}
