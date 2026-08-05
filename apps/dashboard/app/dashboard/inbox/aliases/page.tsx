import * as React from 'react';
import Link from 'next/link';

import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailAliases } from '@/data/inbox/get-mail-aliases';
import { cn } from '@/lib/utils';

export default async function InboxAliasesPage(): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return <InboxUpgradeEmptyState />;
  }

  if (!overview.hasConnections) {
    return (
      <InboxOptionalEmptyState
        title="No aliases yet"
        description="Connect a provider first, then choose which addresses (hello@, security@, …) this workspace handles. Caps depend on your plan."
      />
    );
  }

  const aliases = await getMailAliases();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Aliases</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {overview.aliasCount} of {overview.mailboxAliasLimit} used
          </p>
        </div>
        <Link
          href={Routes.InboxProviders}
          className={cn(buttonVariants({ size: 'sm' }), 'font-mono')}
        >
          Add connection
        </Link>
      </div>

      <ul className="divide-y rounded-md border">
        {aliases.map((alias) => (
          <li
            key={alias.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          >
            <div>
              <p className="font-mono text-sm font-medium">{alias.address}</p>
              <p className="text-xs text-muted-foreground">
                via {alias.providerName} · {alias.memberCount} member
                {alias.memberCount === 1 ? '' : 's'}
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {alias.enabled ? 'Active' : 'Disabled'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
