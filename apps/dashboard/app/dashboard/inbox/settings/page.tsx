import * as React from 'react';
import Link from 'next/link';

import { CompanionWorkspaceSettings } from '@/components/dashboard/inbox/companion-workspace-settings';
import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import {
  InboxSettingsTabs,
  type WorkspaceSettingsTab
} from '@/components/dashboard/inbox/inbox-settings-tabs';
import { MailBlockList } from '@/components/dashboard/inbox/mail-block-list';
import { WorkspaceConnectApps } from '@/components/dashboard/inbox/workspace-connect-apps';
import { WorkspaceSettingsIntro } from '@/components/dashboard/inbox/workspace-settings-intro';
import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { getCompanionWorkspaceRights } from '@/data/inbox/companion-rights';
import { getBlockedSenders } from '@/data/inbox/get-blocked-senders';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailAliases } from '@/data/inbox/get-mail-aliases';
import { normalizeCompanionIntegrations } from '@/lib/inbox/companion-rights';
import { cn } from '@/lib/utils';

function resolveWorkspaceTab(value: string | undefined): WorkspaceSettingsTab {
  if (value === 'companion') return 'companion';
  if (value === 'inbox' || value === 'aliases') return 'inbox';
  return 'connect';
}

export default async function InboxSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; apps?: string }>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  const tab = resolveWorkspaceTab(params.tab);
  // Apps picked during onboarding still need their OAuth grant.
  const pendingApps = normalizeCompanionIntegrations(
    params.apps?.split(',') ?? []
  );

  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return <InboxUpgradeEmptyState />;
  }

  const [aliases, rights, blockedSenders] = await Promise.all([
    getMailAliases(),
    getCompanionWorkspaceRights(),
    getBlockedSenders()
  ]);

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

  const intro =
    tab === 'companion'
      ? 'What Companion may draft, assign, or send, and whether action chips appear above the composer.'
      : tab === 'inbox'
        ? `Humaner detect aliases for your inbox so you can use them while sending emails. Block senders to file their mail to Spam.`
        : overview.canManageProviders
          ? 'Activate Linear, Stripe, or GitHub through Humaner’s Vercel Connect gate.'
          : 'Activate Linear, Stripe, or GitHub through Humaner’s Vercel Connect gate. Only the workspace owner can change this.';

  return (
    <div className="space-y-6">
      <InboxSettingsTabs active={tab} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <WorkspaceSettingsIntro text={intro} />
        {tab === 'inbox' ? (
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
        ) : null}
      </div>

      {tab === 'connect' ? (
        <WorkspaceConnectApps
          integrations={rights.integrations}
          canManage={overview.canManageProviders}
          pending={pendingApps}
        />
      ) : tab === 'companion' ? (
        <CompanionWorkspaceSettings
          actions={rights.actions}
          autoSuggestReplies={overview.autoSuggestReplies}
          actionSuggestions={rights.actionSuggestions}
          canManage={overview.canManageProviders}
        />
      ) : (
        <div className="space-y-4">
          {!overview.hasConnections ? (
            <InboxOptionalEmptyState
              title="Connect an inbox first"
              description="Aliases live on a connected mailbox. Humaner does not create them."
            />
          ) : (
            [...mailboxes.values()].map((mailbox) => (
              <section
                key={`${mailbox.providerName}-${mailbox.email}`}
                className="overflow-hidden rounded-md border"
              >
                <div className="border-b bg-muted/30 px-4 py-2.5">
                  <p className="font-mono text-sm font-medium">
                    {mailbox.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mailbox.providerName} · inbox
                  </p>
                </div>
                <ul className="divide-y">
                  {mailbox.aliases.map((alias) => {
                    const isLogin =
                      alias.address.toLowerCase() ===
                      mailbox.email.toLowerCase();
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
            ))
          )}
          <MailBlockList
            senders={blockedSenders}
            canManage={overview.canManageProviders}
          />
        </div>
      )}
    </div>
  );
}
