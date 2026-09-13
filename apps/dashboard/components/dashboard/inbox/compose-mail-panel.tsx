'use client';

import * as React from 'react';

import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import { ComposeMailForm } from '@/components/dashboard/inbox/compose-mail-form';
import { cn } from '@/lib/utils';

export function ComposeMailPanel({
  className
}: {
  className?: string;
}): React.JSX.Element {
  const { inboxes, defaultAliasId, draft, closeCompose } = useComposeMail();
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRevealed(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn(
        't-panel-slide flex h-full min-h-0 flex-col bg-background',
        className
      )}
      data-open={revealed ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="font-display text-lg tracking-tight">
          {draft?.title ?? 'New message'}
        </p>
        <button
          type="button"
          onClick={closeCompose}
          className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Close
        </button>
      </div>
      <ComposeMailForm
        key={`${draft?.title ?? 'new'}-${draft?.subject ?? ''}`}
        inboxes={inboxes}
        defaultAliasId={defaultAliasId}
        initialTo={draft?.to}
        initialSubject={draft?.subject}
        initialBody={draft?.body}
        onSent={closeCompose}
        className="px-5 py-5"
      />
    </div>
  );
}
