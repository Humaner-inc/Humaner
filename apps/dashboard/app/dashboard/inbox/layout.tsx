import * as React from 'react';

import { SectionPage } from '@/components/ui/section-shell';

/** Brand cobalt — inbox accents (cube, hovers, selection). */
const INBOX_ACCENT = '#0682de';

export default function InboxLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <SectionPage
      width="xl"
      style={{ '--accent-color': INBOX_ACCENT } as React.CSSProperties}
    >
      {children}
    </SectionPage>
  );
}
