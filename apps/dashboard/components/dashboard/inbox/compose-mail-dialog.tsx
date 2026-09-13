'use client';

import * as React from 'react';

import type { ComposeMailDraft } from '@/components/dashboard/inbox/compose-mail-context';
import { ComposeMailForm } from '@/components/dashboard/inbox/compose-mail-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';

export function ComposeMailDialog({
  open,
  onOpenChange,
  inboxes,
  defaultAliasId = null,
  draft = null
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxes: MailInboxOption[];
  defaultAliasId?: string | null;
  draft?: ComposeMailDraft | null;
}): React.JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
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
          onSent={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
          className="min-h-72 px-5 py-5"
        />
      </DialogContent>
    </Dialog>
  );
}
