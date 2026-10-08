'use client';

import * as React from 'react';
import {
  BellIcon,
  InfoIcon,
  MessageCircleIcon,
  PlusIcon
} from '@humaner/shared/icons';

import { DashboardBrandSlot } from '@/components/dashboard/dashboard-brand-slot';
import { DashboardMobileNavTitle } from '@/components/dashboard/dashboard-mobile-nav-title';
import { useDashboardSectionOptional } from '@/components/dashboard/dashboard-section-context';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { useDockNotifications } from '@/components/dashboard/dock/dock-notifications-context';
import { useComposeMailOptional } from '@/components/dashboard/inbox/compose-mail-context';
import { NavUser } from '@/components/dashboard/nav-user';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/hint';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Routes } from '@/constants/routes';
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
  const mailLabel = 'Notifications';
  const sectionNav = useDashboardSectionOptional();
  const hasSections = (sectionNav?.sections.length ?? 0) > 0;
  const compose = useComposeMailOptional();
  const canCompose = compose != null && compose.inboxes.length > 0;

  return (
    <header
      className={cn(
        'relative z-30 flex h-12 shrink-0 items-center gap-1.5 bg-shell px-2 md:grid md:grid-cols-[1fr_1fr] max-md:border-b max-md:border-border/50 max-md:bg-background max-md:px-4',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <DashboardBrandSlot homeHref={oss ? Routes.Home : Routes.Overview} />
        <DashboardMobileNavTitle />
      </div>
      {hasSections ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-12 items-center md:flex">
          <DashboardSectionTabs className="w-full" />
        </div>
      ) : null}
      <div className="flex shrink-0 items-center justify-end gap-1.5">
        {canCompose ? (
          <Hint label="New message">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-sm text-muted-foreground hover:bg-sidebar hover:text-foreground"
              onClick={() => compose.openCompose()}
              aria-label="New message"
            >
              <PlusIcon className="size-4" />
            </Button>
          </Hint>
        ) : null}
        {oss ? null : (
          <Hint label="Team">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'relative size-8 shrink-0 rounded-sm hover:bg-sidebar',
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
            >
              <MessageCircleIcon className="size-4" />
              {teamUnreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] text-white">
                  {teamUnreadCount > 9 ? '9+' : teamUnreadCount}
                </span>
              ) : null}
            </Button>
          </Hint>
        )}
        <Hint label={mailLabel}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-8 shrink-0 rounded-sm text-muted-foreground hover:bg-sidebar hover:text-foreground"
            onClick={() => toggleDock('notifications')}
            aria-label={
              unreadCount > 0
                ? `${mailLabel}, ${unreadCount} unread`
                : mailLabel
            }
          >
            <BellIcon className="size-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Button>
        </Hint>
        <Hint label="Help">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-sm text-muted-foreground hover:bg-sidebar hover:text-foreground"
            onClick={() => toggleDock('help')}
            aria-label="Help"
          >
            <InfoIcon className="size-4" />
          </Button>
        </Hint>
        <Hint label="Theme">
          <ThemeToggle
            variant="ghost"
            className="size-8 shrink-0 rounded-sm text-muted-foreground hover:bg-sidebar hover:text-foreground"
          />
        </Hint>
        <div className="flex h-7 items-center gap-1.5">
          <NavUser
            profile={profile}
            planName={planName}
            audienceLabel={audienceLabel}
          />
        </div>
      </div>
    </header>
  );
}
