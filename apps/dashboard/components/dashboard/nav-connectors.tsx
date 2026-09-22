'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  if (live.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 px-0.5 pt-1">
      {live.map((connector) => {
        const app = CONNECT_APPS.find((item) => item.id === connector.id);
        if (!app) return null;
        const href = inboxConnectorRoute(connector.id);
        const active = pathname.startsWith(href);
        const title = connector.processing
          ? `${app.name} is processing`
          : connector.lastTitle
            ? `${app.name}: ${connector.lastTitle}`
            : `${app.name} · ${connector.inbound} in / ${connector.outbound} out`;

        return (
          <Link
            key={connector.id}
            href={href}
            title={title}
            className={cn(
              'relative flex size-8 items-center justify-center rounded-lg border border-transparent transition-colors',
              active ? 'border-foreground/20 bg-muted/60' : 'hover:bg-muted/40'
            )}
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${app.logoDomain}&sz=64`}
              alt=""
              width={16}
              height={16}
              className="size-4 rounded-sm"
            />
            <span className="sr-only">{title}</span>
            {connector.processing ? (
              <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-[#001afc]" />
            ) : connector.inbound + connector.outbound > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 min-w-3 rounded-full bg-foreground px-0.5 text-center font-mono text-[8px] leading-3 text-background">
                {Math.min(99, connector.inbound + connector.outbound)}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
