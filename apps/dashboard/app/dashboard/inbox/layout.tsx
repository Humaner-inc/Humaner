import * as React from 'react';

/** Brand cobalt — inbox accents (cube, hovers, selection). */
const INBOX_ACCENT = '#0682de';

/**
 * Shell only — triage routes (All mail / Assigned / Providers) are full-bleed;
 * settings-style routes (Aliases / Tags / Archive) opt into Escalation `xl`.
 */
export default function InboxLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      style={{ '--accent-color': INBOX_ACCENT } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
