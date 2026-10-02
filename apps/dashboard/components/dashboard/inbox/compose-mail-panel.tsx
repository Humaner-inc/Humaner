'use client';

import * as React from 'react';
import { XIcon } from '@humaner/shared/icons';

import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import { ComposeMailForm } from '@/components/dashboard/inbox/compose-mail-form';
import { clearComposeDraft } from '@/lib/inbox/compose-draft-storage';
import { cn } from '@/lib/utils';

export function ComposeMailPanel({
  className
}: {
  className?: string;
}): React.JSX.Element {
  const { inboxes, defaultAliasId, draft, workspaceId, closeCompose } =
    useComposeMail();
  const [revealed, setRevealed] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [confirmClose, setConfirmClose] = React.useState(false);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRevealed(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const requestClose = (): void => {
    if (dirty && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    closeCompose();
  };

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
          aria-label="Close"
          onClick={requestClose}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>
      <ComposeMailForm
        key={`${draft?.title ?? 'new'}-${draft?.subject ?? ''}`}
        inboxes={inboxes}
        defaultAliasId={defaultAliasId}
        initialTo={draft?.to}
        initialSubject={draft?.subject}
        initialBody={draft?.body}
        initialDraftThreadId={draft?.draftThreadId}
        confirmClose={confirmClose}
        onDirtyChange={setDirty}
        onSent={() => {
          clearComposeDraft(workspaceId);
          closeCompose();
        }}
        onCancel={closeCompose}
        onDraft={() => {
          clearComposeDraft(workspaceId);
          closeCompose();
        }}
        className="px-5 py-5"
      />
    </div>
  );
}
