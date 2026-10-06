'use client';

import * as React from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { updateInboxAutoDetectMail } from '@/actions/inbox/update-inbox-auto-detect-mail';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function InboxAutoDetectMailToggle({
  enabled,
  canManage = false
}: {
  enabled: boolean;
  canManage?: boolean;
}): React.JSX.Element {
  const [checked, setChecked] = React.useState(enabled);
  const { execute, isExecuting } = useAction(updateInboxAutoDetectMail, {
    onError: ({ error }) => {
      setChecked(enabled);
      toast.error(error.serverError || 'Could not update new-mail detection');
    }
  });

  React.useEffect(() => {
    setChecked(enabled);
  }, [enabled]);

  return (
    <div className="flex items-start justify-between gap-4 rounded-md border px-4 py-3">
      <Label
        htmlFor="inbox-auto-detect-mail"
        className="space-y-1"
      >
        <span className="text-sm font-medium">
          Detect new mail automatically
        </span>
        <span className="block text-xs font-normal text-muted-foreground">
          Sync connected inboxes in the background and toast when mail arrives.
          Turn this off to sync only when you resync or pull to refresh.
          {canManage ? null : ' Only the workspace owner can change this.'}
        </span>
      </Label>
      <Switch
        id="inbox-auto-detect-mail"
        checked={checked}
        disabled={isExecuting || !canManage}
        onCheckedChange={(next) => {
          setChecked(next);
          execute({ enabled: next });
        }}
      />
    </div>
  );
}
