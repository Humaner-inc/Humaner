import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { InboxPreferencesProvider } from '@/components/dashboard/inbox/inbox-preferences-context';
import { Routes } from '@/constants/routes';
import { getInboxAutoSuggestReplies } from '@/data/inbox/inbox-auto-suggest';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { isOssDeployment } from '@/lib/deployment-mode';

/** Brand cobalt — inbox accents (cube, hovers, selection). */
const INBOX_ACCENT = '#2252bc';

/**
 * Shell only — triage routes (Inbox / Assigned / Providers) are full-bleed;
 * settings-style routes (Aliases / Tags / Archive) opt into Escalation `xl`.
 * Self-Host: collaborative Inbox is Cloud-only — leave before Polar/mail compiles.
 */
export default async function InboxLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  if (isOssDeployment()) {
    redirect(Routes.Home);
  }

  await cookies();
  await requireDashboardPageOrRedirect('inbox');
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
