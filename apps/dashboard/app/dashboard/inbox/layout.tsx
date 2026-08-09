import * as React from 'react';
import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';

/** Brand cobalt — inbox accents (cube, hovers, selection). */
const INBOX_ACCENT = '#0682de';

/**
 * Shell only — triage routes (Inbox / Assigned / Providers) are full-bleed;
 * settings-style routes (Aliases / Tags / Archive) opt into Escalation `xl`.
 * Self-Host: collaborative Inbox is Cloud-only — leave before Polar/mail compiles.
 */
export default function InboxLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  if (isOssDeployment()) {
    redirect(Routes.Home);
  }

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      style={{ '--accent-color': INBOX_ACCENT } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
