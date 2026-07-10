'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusIcon } from '@humaner/shared/icons';

import { SidebarBranchIcon } from '@/components/dashboard/sidebar-branch-icon';
import {
  SIDEBAR_HEAD_TITLE_CLASS,
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
import { agentPersonaRoute, Routes } from '@/constants/routes';
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
            tooltip={agent.name}
            isActive={inAgent}
            className={cn('group/agent', SIDEBAR_TREE_TRIGGER_CLASS)}
          >
            <SidebarTreeDisclosureIcon open={open} />
            <Link
              href={agentPersonaRoute(agent.id)}
              className="flex min-w-0 flex-1 items-center group-data-[collapsible=icon]:flex-none"
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarAgentHead
                name={agent.name}
                image={agent.image}
                isPaused={agent.isPaused}
              />
            </Link>
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
  const pathname = usePathname();
  const onNewAgent = pathname === Routes.AgentNew;

  return (
    <SidebarGroup className="py-0">
      <SidebarMenu>
        {agents.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton
              disabled
              className="font-mono text-xs uppercase text-muted-foreground group-data-[collapsible=icon]:justify-center"
            >
              <span className="group-data-[collapsible=icon]:hidden">
                No agents yet
              </span>
              <span className="hidden group-data-[collapsible=icon]:block">
                —
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          agents.map((agent) => (
            <AgentTreeNode
              key={agent.id}
              agent={agent}
            />
          ))
        )}
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={onNewAgent}
            tooltip="New agent"
            className="text-muted-foreground group-data-[collapsible=icon]:justify-center"
          >
            <Link
              href={Routes.AgentNew}
              className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center"
            >
              <PlusIcon
                className="size-3.5 shrink-0"
                strokeWidth={1.5}
              />
              <span
                className={cn(
                  SIDEBAR_HEAD_TITLE_CLASS,
                  'group-data-[collapsible=icon]:hidden'
                )}
              >
                New agent
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
