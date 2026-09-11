'use client';

import * as React from 'react';

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
  defaultAliasId = null
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxes: MailInboxOption[];
  defaultAliasId?: string | null;
}): React.JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex max-h-[min(36rem,90vh)] flex-col gap-0 rounded-lg p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="font-display text-lg font-normal tracking-tight">
            New message
          </DialogTitle>
        </DialogHeader>
        <ComposeMailForm
          inboxes={inboxes}
          defaultAliasId={defaultAliasId}
          onSent={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
          className="min-h-72 px-5 py-5"
        />
      </DialogContent>
    </Dialog>
  );
}
