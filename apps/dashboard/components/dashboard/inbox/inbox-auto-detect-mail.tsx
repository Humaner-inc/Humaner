'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { syncInboxNow } from '@/actions/inbox/sync-inbox-now';
import { useInboxPreferences } from '@/components/dashboard/inbox/inbox-preferences-context';
import { subscribeOrgRealtime } from '@/lib/realtime/client-bus';

/**
 * Safety net only. Live mail arrives through IMAP IDLE / Gmail Pub/Sub and the
 * realtime hub; each poll opens an IMAP session and re-renders the route.
 */
const POLL_INTERVAL_MS = 120_000;
/** First pull soon after landing so a closed-tab gap closes quickly. */
const INITIAL_SYNC_DELAY_MS = 800;

function newMailToast(count: number): void {
  toast.success(
    count === 1 ? 'New email arrived' : `${count} new emails arrived`
  );
}

/**
 * Background mailbox sync while the inbox is open. Toasts when new mail is
 * imported (from polling or org realtime). Gated by workspace preference.
 */
export function InboxAutoDetectMail({
  enabled: serverEnabled
}: {
  enabled: boolean;
}): null {
  const { autoDetectMail } = useInboxPreferences();
  const [synced, setSynced] = React.useState(false);
  React.useEffect(() => {
    setSynced(true);
  }, []);
  // Server prop until preferences hydrate, then live preference.
  const enabled = synced ? autoDetectMail : serverEnabled;

  const router = useRouter();
  const lastToastAtRef = React.useRef(0);

  const { execute, isExecuting } = useAction(syncInboxNow, {
    onSuccess: ({ data }) => {
      const imported = data?.messages ?? 0;
      if (imported > 0) {
        const now = Date.now();
        if (now - lastToastAtRef.current > 4_000) {
          lastToastAtRef.current = now;
          newMailToast(imported);
        }
        router.refresh();
      }
    }
  });

  const executeRef = React.useRef(execute);
  React.useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  const isExecutingRef = React.useRef(isExecuting);
  React.useEffect(() => {
    isExecutingRef.current = isExecuting;
  }, [isExecuting]);

  React.useEffect(() => {
    if (!enabled) return;

    const syncIfVisible = (): void => {
      if (document.visibilityState !== 'visible') return;
      if (isExecutingRef.current) return;
      executeRef.current({});
    };

    const interval = window.setInterval(syncIfVisible, POLL_INTERVAL_MS);
    const onVisibility = (): void => {
      if (document.visibilityState === 'visible') {
        syncIfVisible();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const initial = window.setTimeout(syncIfVisible, INITIAL_SYNC_DELAY_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(initial);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return;

    return subscribeOrgRealtime((event) => {
      if (event.type !== 'inbox.synced') return;
      const count = event.count ?? 0;
      if (count <= 0) return;
      const now = Date.now();
      if (now - lastToastAtRef.current <= 4_000) return;
      lastToastAtRef.current = now;
      newMailToast(count);
    });
  }, [enabled]);

  return null;
}
