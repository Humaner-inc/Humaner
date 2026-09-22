import * as React from 'react';
import { redirect } from 'next/navigation';

import {
  InboxPreferencesProvider,
  InboxPreferencesSync
} from '@/components/dashboard/inbox/inbox-preferences-context';
import { MailboxConnectionAlerts } from '@/components/dashboard/inbox/mailbox-connection-alerts';
import { Routes } from '@/constants/routes';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getInboxAutoSuggestReplies } from '@/data/inbox/inbox-auto-suggest';
import { isOssDeployment } from '@/lib/deployment-mode';

/** Brand cobalt — inbox accents (cube, hovers, selection). */
const INBOX_ACCENT = '#001afc';

async function InboxLayoutChrome(): Promise<React.JSX.Element> {
  const [autoSuggestReplies, overview] = await Promise.all([
    getInboxAutoSuggestReplies(),
    getInboxOverview()
  ]);

  return (
    <>
      <InboxPreferencesSync autoSuggestReplies={autoSuggestReplies} />
      <MailboxConnectionAlerts
        alerts={overview?.connectionAlerts ?? []}
        canManage={overview?.canManageProviders ?? false}
      />
    </>
  );
}

/**
 * Shell only — children stream immediately so Instant Nav is not blocked
 * by Polar/mail chrome. Alerts and reply-suggest hydrate beside the page.
 */
export default function InboxLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  if (isOssDeployment()) {
    redirect(Routes.Home);
  }

  return (
    <InboxPreferencesProvider>
      <div
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        style={{ '--accent-color': INBOX_ACCENT } as React.CSSProperties}
      >
        <React.Suspense fallback={null}>
          <InboxLayoutChrome />
        </React.Suspense>
        {children}
      </div>
    </InboxPreferencesProvider>
  );
}
