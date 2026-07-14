'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import type { CharacterType } from '@prisma/client';

import {
  SIDEBAR_DRAWER_IDS,
  useSidebarNavDrawer
} from '@/components/dashboard/sidebar-nav-accordion';
import {
  SidebarNavChild,
  SidebarNavChildren,
  SidebarNavParent
} from '@/components/dashboard/sidebar-nav-tree';
import { SidebarGroup } from '@/components/ui/sidebar';
import { AGENT_NAV_TABS, getActiveAgentTab } from '@/constants/agent-nav-items';
import { agentPersonaRoute } from '@/constants/routes';
import { resolveAgentAvatarSrc } from '@/lib/agent-avatar';
import { cn } from '@/lib/utils';

export type SidebarAgent = {
  id: string;
  name: string;
  image: string | null;
  character: CharacterType;
  isPaused?: boolean;
};

export type NavAgentTreeProps = {
  agents: SidebarAgent[];
};

function AgentAvatarIcon({
  name,
  image,
  character,
  isPaused
}: {
  name: string;
  image: string | null;
  character: CharacterType;
  isPaused?: boolean;
}): React.JSX.Element {
  const avatarSrc = resolveAgentAvatarSrc(image, character);

  return (
    <span
      className={cn(
        'relative flex size-4 shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-muted',
        isPaused && 'opacity-60 grayscale'
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={avatarSrc}
        src={avatarSrc}
        alt={name}
        className="size-full object-cover"
      />
    </span>
  );
}

function AgentTreeNode({ agent }: { agent: SidebarAgent }): React.JSX.Element {
  const pathname = usePathname();
  const activeTab = getActiveAgentTab(pathname);
  const inAgent = pathname.startsWith(`/dashboard/agents/${agent.id}`);
  const { open, onOpenChange } = useSidebarNavDrawer(
    SIDEBAR_DRAWER_IDS.agent(agent.id)
  );

  return (
    <div>
      <SidebarNavParent
        leading={
          <AgentAvatarIcon
            name={agent.name}
            image={agent.image}
            character={agent.character}
            isPaused={agent.isPaused}
          />
        }
        label={agent.name}
        active={inAgent}
        expanded={open}
        onToggle={() => onOpenChange(!open)}
        href={agentPersonaRoute(agent.id)}
        tooltip={agent.name}
      />
      <SidebarNavChildren expanded={open}>
        {AGENT_NAV_TABS.map((tab) => (
          <SidebarNavChild
            key={tab.id}
            href={tab.href(agent.id)}
            label={tab.label}
            active={inAgent && activeTab === tab.id}
          />
        ))}
      </SidebarNavChildren>
    </div>
  );
}

export function NavAgentTree({ agents }: NavAgentTreeProps): React.JSX.Element {
  if (agents.length === 0) {
    return <></>;
  }

  return (
    <SidebarGroup className="py-0">
      <div className="space-y-0.5">
        {agents.map((agent) => (
          <AgentTreeNode
            key={agent.id}
            agent={agent}
          />
        ))}
      </div>
    </SidebarGroup>
  );
}
