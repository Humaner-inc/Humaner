'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { syncInboxNow } from '@/actions/inbox/sync-inbox-now';
import { Routes } from '@/constants/routes';

const GMAIL_TOASTS: Record<
  string,
  { type: 'success' | 'error'; message: string }
> = {
  connected: {
    type: 'success',
    message: 'Google mailbox connected. Aliases are ready in Inbox.'
  },
  denied: {
    type: 'error',
    message: 'Google authorization was cancelled.'
  },
  reauth: {
    type: 'error',
    message:
      'Google did not return a refresh token. Connect again and approve access.'
  },
  limit: {
    type: 'error',
    message: 'This plan has no mailbox slots left. Add a mailbox to continue.'
  },
  failed: {
    type: 'error',
    message: 'Could not connect Google mail. Try again.'
  },
  scopes: {
    type: 'error',
    message:
      'Google did not grant full Gmail access. Reconnect and allow permission to sync, move, and delete mail.'
  }
};

export function GmailConnectToast(): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('gmail');
  const { execute: runPostConnectSync } = useAction(syncInboxNow);
  const postConnectSyncRef = React.useRef(runPostConnectSync);
  postConnectSyncRef.current = runPostConnectSync;

  React.useEffect(() => {
    if (!status) return;
    const toastCopy = GMAIL_TOASTS[status];
    if (toastCopy?.type === 'success') {
      toast.success(toastCopy.message);
      void postConnectSyncRef.current({});
    } else if (toastCopy) {
      toast.error(toastCopy.message);
    }
    router.replace(Routes.InboxProviders);
    router.refresh();
  }, [router, status]);

  return null;
}
