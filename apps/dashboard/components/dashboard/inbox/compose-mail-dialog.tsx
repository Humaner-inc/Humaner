'use client';

import * as React from 'react';
import { toast } from 'sonner';

import type { ComposeMailDraft } from '@/components/dashboard/inbox/compose-mail-context';
import { ComposeMailForm } from '@/components/dashboard/inbox/compose-mail-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import {
  clearComposeDraft,
  composeDraftHasContent,
  saveComposeDraft
} from '@/lib/inbox/compose-draft-storage';

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
      <DialogContent className="flex max-h-[min(36rem,90vh)] flex-col gap-0 rounded-lg p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="font-display text-lg font-normal tracking-tight">
            {draft?.title ?? 'New message'}
          </DialogTitle>
        </DialogHeader>
        <ComposeMailForm
          key={`${draft?.title ?? 'new'}-${draft?.subject ?? ''}`}
          inboxes={inboxes}
          defaultAliasId={defaultAliasId}
          initialTo={draft?.to}
          initialSubject={draft?.subject}
          initialBody={draft?.body}
          confirmClose={confirmClose}
          onDirtyChange={setDirty}
          onSent={() => {
            clearComposeDraft(workspaceId);
            close();
          }}
          onCancel={close}
          onDraft={(values) => {
            if (composeDraftHasContent(values)) {
              saveComposeDraft(workspaceId, values);
              toast.success('Draft saved');
            }
            close();
          }}
          className="min-h-72 px-5 py-5"
        />
      </DialogContent>
    </Dialog>
  );
}
