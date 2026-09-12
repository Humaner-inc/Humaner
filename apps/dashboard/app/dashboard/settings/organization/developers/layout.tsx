import * as React from 'react';
import { type Metadata } from 'next';
import { Code } from '@phosphor-icons/react/dist/ssr/Code';

import { PresentationPageMark } from '@/components/dashboard/workspace-page-shell';
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
    <div className="space-y-8">
      <header className="flex items-start gap-3.5">
        <PresentationPageMark className="bg-[#2252bc] text-[#fcf4ec]">
          <Code
            className="size-6"
            weight="duotone"
          />
        </PresentationPageMark>
        <div className="min-w-0">
          <h1 className="page-title">MCP</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Point Cursor or Claude Code at the mailbox — same tools as REST for
            mail, calendar, and tasks.
          </p>
        </div>
      </header>
      {apiKeys}
      {webhooks}
    </div>
  );
}
