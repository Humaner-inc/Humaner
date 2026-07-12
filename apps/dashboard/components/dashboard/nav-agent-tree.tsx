'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarBranchIcon } from '@/components/dashboard/sidebar-branch-icon';
import {
  SIDEBAR_TREE_TRIGGER_CLASS,
  SidebarAgentHead,
  SidebarBranchItem,
  SidebarBranchLabel,
  SidebarBranchNav,
  SidebarTreeDisclosureIcon
} from '@/components/dashboard/sidebar-branch-nav';
import {
  SIDEBAR_DRAWER_IDS,
  useSidebarNavDrawer
} from '@/components/dashboard/sidebar-nav-accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { AGENT_NAV_TABS, getActiveAgentTab } from '@/constants/agent-nav-items';
import { cn } from '@/lib/utils';

export type SidebarAgent = {
  id: string;
  name: string;
  image: string | null;
  isPaused?: boolean;
};

export type NavAgentTreeProps = {
  agents: SidebarAgent[];
};

function AgentTreeNode({ agent }: { agent: SidebarAgent }): React.JSX.Element {
  const pathname = usePathname();
  const activeTab = getActiveAgentTab(pathname);
  const inAgent = pathname.startsWith(`/dashboard/agents/${agent.id}`);
  const activeIndex = AGENT_NAV_TABS.findIndex((tab) => tab.id === activeTab);
  const { open, onOpenChange } = useSidebarNavDrawer(
    SIDEBAR_DRAWER_IDS.agent(agent.id)
  );

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
    >
      <SidebarMenuItem className="relative">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            variant="section"
            tooltip={agent.name}
            isActive={inAgent}
            className={cn('group/agent', SIDEBAR_TREE_TRIGGER_CLASS)}
          >
            <SidebarTreeDisclosureIcon open={open} />
            <SidebarAgentHead
              name={agent.name}
              image={agent.image}
              isPaused={agent.isPaused}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="group-data-[collapsible=icon]:overflow-visible">
          <SidebarBranchNav activeIndex={inAgent ? activeIndex : -1}>
            {AGENT_NAV_TABS.map((tab) => {
              const isActive = inAgent && activeTab === tab.id;

              return (
                <SidebarBranchItem
                  key={tab.id}
                  asChild
                  isActive={isActive}
                  tooltip={tab.label}
                >
                  <Link href={tab.href(agent.id)}>
                    <SidebarBranchIcon icon={tab.icon} />
                    <SidebarBranchLabel isActive={isActive}>
                      {tab.label}
                    </SidebarBranchLabel>
                  </Link>
                </SidebarBranchItem>
              );
            })}
          </SidebarBranchNav>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavAgentTree({ agents }: NavAgentTreeProps): React.JSX.Element {
  return (
    <SidebarGroup className="py-0">
      <SidebarMenu>
        {agents.map((agent) => (
          <AgentTreeNode
            key={agent.id}
            agent={agent}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
