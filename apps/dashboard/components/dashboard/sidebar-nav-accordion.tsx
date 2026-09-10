'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { isDeskPath } from '@/constants/desk-nav-items';
import { isInboxPath } from '@/constants/inbox-nav-items';
import { isIntegrationsPath } from '@/constants/integration-nav-items';
import {
  isPerInboxMailboxPath,
  isWorkspaceDrawerPath
} from '@/constants/mailbox-nav-items';
import { isOssDeployment } from '@/lib/deployment-mode';

export const SIDEBAR_DRAWER_IDS = {
  integrations: 'integrations',
  inbox: 'inbox',
  workspace: 'workspace',
  desk: 'desk',
  agent: (agentId: string) => `agent:${agentId}`
} as const;

type SidebarNavAccordionContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const SidebarNavAccordionContext =
  React.createContext<SidebarNavAccordionContextValue | null>(null);

export function getActiveSidebarDrawerId(
  pathname: string,
  agents: { id: string }[]
): string | null {
  if (isIntegrationsPath(pathname)) return SIDEBAR_DRAWER_IDS.integrations;
  if (isOssDeployment()) {
    if (isInboxPath(pathname)) return SIDEBAR_DRAWER_IDS.inbox;
  } else if (isPerInboxMailboxPath(pathname)) {
    return SIDEBAR_DRAWER_IDS.inbox;
  }
  if (!isOssDeployment() && isWorkspaceDrawerPath(pathname)) {
    return SIDEBAR_DRAWER_IDS.workspace;
  }
  if (isDeskPath(pathname)) return SIDEBAR_DRAWER_IDS.desk;

  const agent = agents.find((item) =>
    pathname.startsWith(`/agents/${item.id}`)
  );
  if (agent) return SIDEBAR_DRAWER_IDS.agent(agent.id);

  return null;
}

export type SidebarNavAccordionProviderProps = {
  agents: { id: string }[];
  children: React.ReactNode;
};

export function SidebarNavAccordionProvider({
  agents,
  children
}: SidebarNavAccordionProviderProps): React.JSX.Element {
  const pathname = usePathname();
  const [openId, setOpenId] = React.useState<string | null>(() =>
    getActiveSidebarDrawerId(pathname, agents)
  );

  React.useEffect(() => {
    const activeId = getActiveSidebarDrawerId(pathname, agents);
    if (activeId) {
      setOpenId(activeId);
    }
  }, [pathname, agents]);

  const value = React.useMemo(() => ({ openId, setOpenId }), [openId]);

  return (
    <SidebarNavAccordionContext.Provider value={value}>
      {children}
    </SidebarNavAccordionContext.Provider>
  );
}

export function useSidebarNavDrawer(drawerId: string): {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} {
  const context = React.useContext(SidebarNavAccordionContext);

  if (!context) {
    throw new Error(
      'useSidebarNavDrawer must be used within SidebarNavAccordionProvider'
    );
  }

  const { openId, setOpenId } = context;
  const open = openId === drawerId;

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        setOpenId(drawerId);
        return;
      }
      if (openId === drawerId) {
        setOpenId(null);
      }
    },
    [drawerId, openId, setOpenId]
  );

  return { open, onOpenChange };
}
