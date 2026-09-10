import * as React from 'react';
import Link from 'next/link';

import { AliasCompanionPolicySelect } from '@/components/dashboard/inbox/alias-companion-policy-select';
import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailAliases } from '@/data/inbox/get-mail-aliases';
import { cn } from '@/lib/utils';

export default async function InboxSettingsPage(): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return <InboxUpgradeEmptyState />;
  }

  if (!overview.hasConnections) {
    return (
      <InboxOptionalEmptyState
        title="Connect an inbox first"
        description="Aliases live on a connected mailbox. Humaner does not create them."
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
          <h1 className="page-title">Inbox settings</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            An inbox is the mailbox you connect. Aliases are sending addresses
            on that inbox — for example hello@humaner.io on dev@humaner.io.
          </p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {overview.connectionCount} of {overview.mailboxAliasLimit} mailbox
            {overview.mailboxAliasLimit === 1 ? '' : 'es'} connected · aliases
            on a mailbox are free
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={Routes.InboxTags}
            className={cn(
              buttonVariants({ size: 'sm', variant: 'outline' }),
              'font-mono'
            )}
          >
            Tags
          </Link>
          <Link
            href={Routes.InboxProviders}
            className={cn(buttonVariants({ size: 'sm' }), 'font-mono')}
          >
            Providers
          </Link>
        </div>
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
                {mailbox.providerName} · inbox
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
                        {alias.memberCount === 1 ? '' : 's'} · Companion may
                        draft, assign, or send
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AliasCompanionPolicySelect
                        aliasId={alias.id}
                        policy={alias.companionPolicy}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {alias.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
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
