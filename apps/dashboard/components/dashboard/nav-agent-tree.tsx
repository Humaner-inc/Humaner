'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { CodeIcon } from '@humaner/shared/icons';
import type { CharacterType } from '@prisma/client';

import {
  SIDEBAR_DRAWER_IDS,
  useSidebarNavDrawer
} from '@/components/dashboard/sidebar-nav-accordion';
import {
  shouldShowSidebarUpgradeBanner,
  SidebarNavChild,
  SidebarNavChildren,
  SidebarNavParent,
  SidebarNavUpgradeHeader
} from '@/components/dashboard/sidebar-nav-tree';
import { SidebarGroup } from '@/components/ui/sidebar';
import {
  getActiveAgentTab,
  getAgentNavTabs,
  getDefaultAgentTabRoute,
  isAgentTabLocked,
  isCustomAgentWorkspace
} from '@/constants/agent-nav-items';
import { Routes } from '@/constants/routes';
import { resolveSidebarAgentAvatar } from '@/lib/agent-avatar';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

/**
 * Custom brings its own agent, so the sidebar shows the implementation rather
 * than a Humaner persona name.
 */
const CUSTOM_AGENT_LABEL = 'Your agent';

export type SidebarAgent = {
  id: string;
  name: string;
  image: string | null;
  character: CharacterType;
  isPaused?: boolean;
};

export type NavAgentTreeProps = {
  agents: SidebarAgent[];
  orgTier: string;
  frontierBetaEnabled?: boolean;
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
  const avatar = resolveSidebarAgentAvatar(image, character);

  return (
    <span
      className={cn(
        'relative flex size-4 shrink-0 items-center justify-center overflow-hidden border border-border/60',
        dashboardRadiusClassName,
        isPaused && 'opacity-60 grayscale',
        avatar.kind === 'image' && 'bg-muted'
      )}
      style={
        avatar.kind === 'disk' ? { backgroundColor: avatar.color } : undefined
      }
    >
      {avatar.kind === 'image' ? (
        <img
          key={avatar.src}
          src={avatar.src}
          alt={name}
          className="size-full object-cover"
        />
      ) : null}
    </span>
  );
}

function CustomAgentIcon({
  isPaused
}: {
  isPaused?: boolean;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'flex size-4 shrink-0 items-center justify-center border border-border/60 bg-muted/40',
        dashboardRadiusClassName,
        isPaused && 'opacity-60 grayscale'
      )}
    >
      <CodeIcon className="size-2.5 text-muted-foreground" />
    </span>
  );
}

function AgentTreeNode({
  agent,
  orgTier,
  frontierBetaEnabled = true
}: {
  agent: SidebarAgent;
  orgTier: string;
  frontierBetaEnabled?: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const activeTab = getActiveAgentTab(pathname);
  const inAgent = pathname.startsWith(`/agents/${agent.id}`);
  const { open, onOpenChange } = useSidebarNavDrawer(
    SIDEBAR_DRAWER_IDS.agent(agent.id)
  );
  const custom = isCustomAgentWorkspace(orgTier);
  const tabs = getAgentNavTabs(orgTier);
  const capabilityContext = { frontierBetaEnabled };
  const lockedCount = tabs.filter((tab) =>
    isAgentTabLocked(tab, orgTier, capabilityContext)
  ).length;
  const showUpgradeBanner = shouldShowSidebarUpgradeBanner(lockedCount);
  const label = custom ? CUSTOM_AGENT_LABEL : agent.name;

  return (
    <div>
      <SidebarNavParent
        leading={
          custom ? (
            <CustomAgentIcon isPaused={agent.isPaused} />
          ) : (
            <AgentAvatarIcon
              name={agent.name}
              image={agent.image}
              character={agent.character}
              isPaused={agent.isPaused}
            />
          )
        }
        label={label}
        active={inAgent}
        expanded={open}
        onToggle={() => onOpenChange(!open)}
        href={getDefaultAgentTabRoute(agent.id, orgTier)}
        tooltip={label}
      />
      <SidebarNavChildren expanded={open}>
        {showUpgradeBanner ? (
          <SidebarNavUpgradeHeader href={Routes.Billing} />
        ) : null}
        {tabs.map((tab) => {
          const locked = isAgentTabLocked(tab, orgTier, capabilityContext);
          return (
            <SidebarNavChild
              key={tab.id}
              href={tab.href(agent.id)}
              label={tab.label}
              active={inAgent && activeTab === tab.id}
              disabled={locked}
              tabIndex={locked ? -1 : undefined}
              badge={
                locked && !showUpgradeBanner ? (
                  <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                    Upgrade
                  </span>
                ) : undefined
              }
            />
          );
        })}
      </SidebarNavChildren>
    </div>
  );
}

export function NavAgentTree({
  agents,
  orgTier,
  frontierBetaEnabled = true
}: NavAgentTreeProps): React.JSX.Element {
  if (agents.length === 0) {
    return <></>;
  }

  return (
    <SidebarGroup className="p-0">
      <div className="space-y-0.5">
        {agents.map((agent) => (
          <AgentTreeNode
            key={agent.id}
            agent={agent}
            orgTier={orgTier}
            frontierBetaEnabled={frontierBetaEnabled}
          />
        ))}
      </div>
    </SidebarGroup>
  );
}
