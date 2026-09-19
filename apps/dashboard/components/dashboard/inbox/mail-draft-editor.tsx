'use client';

import * as React from 'react';

import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import { ComposeMailForm } from '@/components/dashboard/inbox/compose-mail-form';
import type { MailThreadDetail } from '@/data/inbox/get-mail-threads';
import { composeDraftFormSubject } from '@/lib/inbox/compose-draft';

export function MailDraftEditor({
  thread,
  onClosed,
  onSent
}: {
  thread: MailThreadDetail;
  onClosed?: () => void;
  onSent?: () => void;
}): React.JSX.Element {
  const { inboxes } = useComposeMail();
  const latest = thread.messages[thread.messages.length - 1];
  const [dirty, setDirty] = React.useState(false);
  const [confirmClose, setConfirmClose] = React.useState(false);

  const requestClose = (): void => {
    if (dirty && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    onClosed?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="font-display text-lg tracking-tight">Draft</p>
        <button
          type="button"
          onClick={requestClose}
          className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Close
        </button>
      </div>
      <ComposeMailForm
        inboxes={inboxes}
        defaultAliasId={thread.aliasId}
        initialTo={latest?.toAddresses[0] ?? ''}
        initialSubject={composeDraftFormSubject(thread.subject)}
        initialBody={latest?.bodyText ?? ''}
        initialDraftThreadId={thread.id}
        confirmClose={confirmClose}
        onDirtyChange={setDirty}
        onSent={onSent}
        onCancel={onClosed}
        onDraft={onClosed}
        className="px-5 py-5"
      />
    </div>
  );
}
