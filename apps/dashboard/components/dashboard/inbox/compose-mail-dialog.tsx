'use client';

import * as React from 'react';

import type { ComposeMailDraft } from '@/components/dashboard/inbox/compose-mail-context';
import { ComposeMailForm } from '@/components/dashboard/inbox/compose-mail-form';
import { QuickCreateDialogContent } from '@/components/dashboard/quick-create-dialog';
import { Dialog } from '@/components/ui/dialog';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { clearComposeDraft } from '@/lib/inbox/compose-draft-storage';

export function ComposeMailDialog({
  open,
  onOpenChange,
  inboxes,
  workspaceId,
  defaultAliasId = null,
  draft = null
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxes: MailInboxOption[];
  workspaceId: string;
  defaultAliasId?: string | null;
  draft?: ComposeMailDraft | null;
}): React.JSX.Element {
  const [dirty, setDirty] = React.useState(false);
  const [confirmClose, setConfirmClose] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setConfirmClose(false);
      setDirty(false);
    }
  }, [open]);

  const close = (): void => {
    setConfirmClose(false);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && dirty) {
          setConfirmClose(true);
          return;
        }
        onOpenChange(next);
      }}
    >
      <QuickCreateDialogContent
        title={draft?.title ?? 'New message'}
        description="Compose and send a new email."
        className="max-h-[min(36rem,90vh)]"
      >
        <ComposeMailForm
          key={`${draft?.title ?? 'new'}-${draft?.subject ?? ''}`}
          layout="quick"
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
            close();
          }}
          onCancel={close}
          onDraft={() => {
            clearComposeDraft(workspaceId);
            close();
          }}
        />
      </QuickCreateDialogContent>
    </Dialog>
  );
}
