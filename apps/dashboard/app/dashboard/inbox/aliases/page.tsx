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
        description="Connect a mailbox first. Aliases are sending addresses on that inbox — Humaner does not create them."
      />
    );
  }

  const aliases = await getMailAliases();
  const mailboxes = new Map<
    string,
    {
      email: string;
      providerName: string;
      aliases: typeof aliases;
    }
  >();

  for (const alias of aliases) {
    const key = `${alias.providerName}::${alias.connectionEmail}`;
    const existing = mailboxes.get(key);
    if (existing) {
      existing.aliases.push(alias);
    } else {
      mailboxes.set(key, {
        email: alias.connectionEmail,
        providerName: alias.providerName,
        aliases: [alias]
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Aliases</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {overview.aliasCount} of {overview.mailboxAliasLimit} sending
            addresses · grouped by mailbox
          </p>
        </div>
        <Link
          href={Routes.InboxProviders}
          className={cn(buttonVariants({ size: 'sm' }), 'font-mono')}
        >
          Add connection
        </Link>
      </div>

      <div className="space-y-4">
        {[...mailboxes.values()].map((mailbox) => (
          <section
            key={`${mailbox.providerName}-${mailbox.email}`}
            className="overflow-hidden rounded-md border"
          >
            <div className="border-b bg-muted/30 px-4 py-2.5">
              <p className="font-mono text-sm font-medium">{mailbox.email}</p>
              <p className="text-xs text-muted-foreground">
                {mailbox.providerName} · one inbox
              </p>
            </div>
            <ul className="divide-y">
              {mailbox.aliases.map((alias) => {
                const isLogin =
                  alias.address.toLowerCase() === mailbox.email.toLowerCase();
                return (
                  <li
                    key={alias.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {alias.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isLogin ? 'Mailbox login' : 'Sending alias'} ·{' '}
                        {alias.memberCount} member
                        {alias.memberCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {alias.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
