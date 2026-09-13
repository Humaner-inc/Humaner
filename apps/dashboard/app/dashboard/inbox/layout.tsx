import * as React from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { InboxPreferencesProvider } from '@/components/dashboard/inbox/inbox-preferences-context';
import { Routes } from '@/constants/routes';
import { getInboxAutoSuggestReplies } from '@/data/inbox/inbox-auto-suggest';
import { isOssDeployment } from '@/lib/deployment-mode';

/** Brand cobalt — inbox accents (cube, hovers, selection). */
const INBOX_ACCENT = '#2252bc';

function InboxLayoutFallback(): React.JSX.Element {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      style={{ '--accent-color': INBOX_ACCENT } as React.CSSProperties}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted/40" />
        <div className="h-32 animate-pulse rounded-md bg-muted/40" />
        <div className="h-32 animate-pulse rounded-md bg-muted/40" />
      </div>
    </div>
  );
}

async function InboxLayoutBody({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  await connection();
  const autoSuggestReplies = await getInboxAutoSuggestReplies();

  return (
    <InboxPreferencesProvider autoSuggestReplies={autoSuggestReplies}>
      <div
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        style={{ '--accent-color': INBOX_ACCENT } as React.CSSProperties}
      >
        {children}
      </div>
    </InboxPreferencesProvider>
  );
}

/**
 * Shell only — triage routes (Inbox / Assigned / Providers) are full-bleed;
 * settings-style routes (Aliases / Tags / Archive) opt into Escalation `xl`.
 * Self-Host: collaborative Inbox is Cloud-only — leave before Polar/mail compiles.
 *
 * Request IO stays behind `connection()` so Cache Components can prerender
 * this layout without Auth.js `crypto.getRandomValues()`.
 */
export default function InboxLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  if (isOssDeployment()) {
    redirect(Routes.Home);
  }

  return (
    <React.Suspense fallback={<InboxLayoutFallback />}>
      <InboxLayoutBody>{children}</InboxLayoutBody>
    </React.Suspense>
  );
}
