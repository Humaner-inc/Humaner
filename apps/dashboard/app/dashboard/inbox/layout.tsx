import * as React from 'react';

import { SectionPage } from '@/components/ui/section-shell';

export default function InboxLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return <SectionPage width="xl">{children}</SectionPage>;
}
