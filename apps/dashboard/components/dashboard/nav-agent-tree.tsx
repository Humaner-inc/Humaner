'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon, PlusIcon } from '@humaner/shared/icons';

import { SidebarBranchIcon } from '@/components/dashboard/sidebar-branch-icon';
import {
  SIDEBAR_HEAD_TITLE_CLASS,
  SidebarBranchItem,
  SidebarBranchLabel,
  SidebarBranchNav
} from '@/components/dashboard/sidebar-branch-nav';
import {
  AGENT_NAV_TABS,
  getActiveAgentTab
} from '@/constants/agent-nav-items';
import { agentPersonaRoute, Routes } from '@/constants/routes';
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
  const [open, setOpen] = React.useState(inAgent);

  React.useEffect(() => {
    if (inAgent) setOpen(true);
  }, [inAgent]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem className="relative">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={agent.name}
            isActive={inAgent}
            className="group/agent pr-8"
          >
            <Link
              href={agentPersonaRoute(agent.id)}
              className="flex min-w-0 flex-1 items-center"
              onClick={(event) => event.stopPropagation()}
            >
              <span
                className={cn(
                  SIDEBAR_HEAD_TITLE_CLASS,
                  agent.isPaused && 'opacity-60'
                )}
              >
                {agent.name}
              </span>
            </Link>
            <ChevronDownIcon
              className={cn(
                'absolute right-2 size-4 text-muted-foreground transition-transform',
                open && 'rotate-180'
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarBranchNav activeIndex={inAgent ? activeIndex : -1}>
            {AGENT_NAV_TABS.map((tab) => {
              const isActive = inAgent && activeTab === tab.id;

              return (
                <SidebarBranchItem
                  key={tab.id}
                  asChild
                  isActive={isActive}
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
            <SidebarMenuButton disabled className="font-mono text-xs uppercase text-muted-foreground">
              No agents yet
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
            className="text-muted-foreground"
          >
            <Link href={Routes.AgentNew} className="flex min-w-0 items-center gap-2">
              <PlusIcon className="size-3.5 shrink-0" strokeWidth={1.5} />
              <span className={SIDEBAR_HEAD_TITLE_CLASS}>New agent</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
