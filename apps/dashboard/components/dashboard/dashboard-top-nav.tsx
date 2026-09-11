'use client';

import * as React from 'react';
import { BellIcon, InfoIcon } from '@humaner/shared/icons';

import { CompanionIcon } from '@/components/dashboard/ask-humaner/companion-icon';
import { useHumanerChatOptional } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { useDockNotifications } from '@/components/dashboard/dock/dock-notifications-context';
import { NavUser } from '@/components/dashboard/nav-user';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

const oss = isOssDeployment();

export type DashboardTopNavProps = {
  profile: ProfileDto;
  workspaces: UserWorkspaceSummary[];
  planName: string;
  industryLabel: string | null;
  audienceLabel: string | null;
  className?: string;
};

export function DashboardTopNav({
  profile,
  workspaces,
  planName,
  industryLabel,
  audienceLabel,
  className
}: DashboardTopNavProps): React.JSX.Element {
  const { toggleDock } = useDashboardDock();
  const { unreadCount } = useDockNotifications();
  const chat = useHumanerChatOptional();
  const mailLabel = oss ? 'Notifications' : 'Mail';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur-xl sm:px-5',
        className
      )}
    >
      {chat ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'size-9 shrink-0 rounded-lg hover:bg-muted/60',
            chat.companionVisible
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => chat.setCompanionVisible(!chat.companionVisible)}
          aria-pressed={chat.companionVisible}
          aria-label={
            chat.companionVisible ? 'Hide Companion' : 'Show Companion'
          }
          title={chat.companionVisible ? 'Companion on' : 'Companion off'}
        >
          <CompanionIcon
            active={chat.companionVisible}
            character={chat.companionCharacter}
          />
        </Button>
      ) : null}
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
          workspaces={workspaces}
          planName={planName}
          industryLabel={industryLabel}
          audienceLabel={audienceLabel}
        />
      </div>
    </header>
  );
}
