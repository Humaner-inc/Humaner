'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import {
  BotIcon,
  BookOpenIcon,
  HeadsetIcon,
  Layers,
  ShieldIcon,
  UsersIcon
} from '@humaner/shared/icons';
import { PageDock, PageDockItem } from '@/components/ui/page-dock';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { LucideIcon } from '@humaner/shared/icons';

type DeskTab = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

const DESK_TABS: DeskTab[] = [
  { id: 'ai', label: 'AI Desk', href: Routes.DeskAI, icon: BotIcon },
  { id: 'human', label: 'Human Desk', href: Routes.DeskHuman, icon: HeadsetIcon },
  { id: 'runbooks', label: 'Runbooks', href: Routes.DeskRunbooks, icon: BookOpenIcon },
  { id: 'clusters', label: 'Clusters', href: Routes.DeskClusters, icon: Layers },
  { id: 'escalation', label: 'Escalation', href: Routes.DeskEscalation, icon: ShieldIcon },
  { id: 'team', label: 'Team', href: Routes.DeskTeam, icon: UsersIcon }
];

function DeskDockItem({ tab }: { tab: DeskTab }): React.JSX.Element {
  const pathname = usePathname();
  const isActive = pathname.startsWith(tab.href);
  const Icon = tab.icon;

  return (
    <PageDockItem
      label={tab.label}
      href={tab.href}
      isActive={isActive}
      variant="glass"
    >
      <Icon
        className={cn(
          'size-6 shrink-0 transition-colors duration-300',
          isActive
            ? 'text-foreground dark:text-[#fff8f2]'
            : 'text-foreground/55 group-hover:text-foreground/80 dark:text-white/50 dark:group-hover:text-white/75'
        )}
        strokeWidth={1.25}
      />
    </PageDockItem>
  );
}

export function DeskDock(): React.JSX.Element {
  return (
    <PageDock className="pb-6">
      {DESK_TABS.map((tab) => (
        <DeskDockItem
          key={tab.id}
          tab={tab}
        />
      ))}
    </PageDock>
  );
}
