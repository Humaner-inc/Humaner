import * as React from 'react';
import type { Metadata } from 'next';

import { SectionPage } from '@/components/ui/section-shell';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Settings')
};

export default function SettingsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return <SectionPage width="xl">{children}</SectionPage>;
}
