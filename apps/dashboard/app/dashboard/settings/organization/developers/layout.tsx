import * as React from 'react';
import { type Metadata } from 'next';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('MCP')
};

export type DevelopersLayoutProps = {
  apiKeys: React.ReactNode;
  webhooks: React.ReactNode;
};

export default function DevelopersLayout({
  apiKeys,
  webhooks
}: DevelopersLayoutProps): React.JSX.Element {
  return (
    <AnnotatedLayout className="py-0">
      {apiKeys}
      <Separator />
      {webhooks}
    </AnnotatedLayout>
  );
}
