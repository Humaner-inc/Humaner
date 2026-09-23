'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Plug } from '@humaner/shared/icons';

import { BrandLogo } from '@/components/dashboard/integrations/brand-logo';
import { SidebarNavLink } from '@/components/dashboard/sidebar-nav-tree';
import { inboxConnectorRoute } from '@/constants/routes';
import { CONNECT_APPS } from '@/lib/connect-apps';
import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';
import { cn } from '@/lib/utils';

export type ConnectorNavItem = {
  id: CompanionIntegrationId;
  processing: boolean;
  inbound: number;
  outbound: number;
  lastTitle: string | null;
};

function ConnectorActivityBadge({
  processing,
  count
}: {
  processing: boolean;
  count: number;
}): React.JSX.Element | null {
  if (processing) {
    return (
      <span
        className="size-1.5 shrink-0 rounded-full bg-[#226342]"
        aria-hidden
      />
    );
  }
  if (count <= 0) {
    return null;
  }
  return (
    <span className="min-w-4 font-mono text-[10px] leading-none tabular-nums text-sidebar-foreground/50">
      {Math.min(99, count)}
    </span>
  );
}

export function NavConnectors({
  connectors
}: {
  connectors: ConnectorNavItem[];
}): React.JSX.Element | null {
  const pathname = usePathname();
  const [live, setLive] = React.useState(connectors);

  React.useEffect(() => {
    setLive(connectors);
  }, [connectors]);

  React.useEffect(() => {
    if (connectors.length === 0) return;
    let active = true;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch('/api/dashboard/connectors/activity', {
          cache: 'no-store'
        });
        if (!response.ok || !active) return;
        const data = (await response.json()) as {
          connectors?: ConnectorNavItem[];
        };
        if (Array.isArray(data.connectors)) {
          setLive(data.connectors);
        }
      } catch {
        // Keep last known activity.
      }
    };

    const interval = window.setInterval(() => {
      void poll();
    }, 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [connectors.length]);

  const activityById = React.useMemo(() => {
    const next = new Map<CompanionIntegrationId, ConnectorNavItem>();
    for (const item of live) {
      next.set(item.id, item);
    }
    return next;
  }, [live]);

  const connected = CONNECT_APPS.filter((app) => activityById.has(app.id));
  if (connected.length === 0) {
    return null;
  }

  return (
    <div className="mt-1 space-y-0.5">
      {connected.map((app) => {
        const href = inboxConnectorRoute(app.id);
        const active = pathname.startsWith(href);
        const activity = activityById.get(app.id);
        const count = activity ? activity.inbound + activity.outbound : 0;
        return (
          <SidebarNavLink
            key={app.id}
            href={href}
            label={app.name}
            active={active}
            mainNavHighlight
            badge={
              <ConnectorActivityBadge
                processing={activity?.processing ?? false}
                count={count}
              />
            }
            leading={
              <BrandLogo
                domain={app.logoDomain}
                fallbackIcon={Plug}
                size={32}
                className={cn(
                  'size-4 shrink-0',
                  active
                    ? 'opacity-100'
                    : 'opacity-70 group-hover/nav:opacity-100'
                )}
              />
            }
          />
        );
      })}
    </div>
  );
}
