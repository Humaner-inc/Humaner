'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { syncInboxNow } from '@/actions/inbox/sync-inbox-now';
import { Routes } from '@/constants/routes';

type FolderKey = 'INBOX' | 'SPAM' | 'TRASH' | 'SENT' | 'ARCHIVE';

// IDLE + auto-detect cover INBOX; every other folder is fetched when opened.
const FOLDER_BY_PATH: Record<string, FolderKey> = {
  [Routes.InboxSpam]: 'SPAM',
  [Routes.InboxTrash]: 'TRASH',
  [Routes.InboxSent]: 'SENT',
  [Routes.InboxArchive]: 'ARCHIVE'
};

/** Don't re-fetch a folder the user just left and came back to. */
const MIN_REFETCH_MS = 20_000;

export function InboxFolderSync(): null {
  const pathname = usePathname();
  const router = useRouter();
  const lastSyncedRef = React.useRef<Record<string, number>>({});

  const { execute } = useAction(syncInboxNow, {
    onSuccess: ({ data }) => {
      if ((data?.messages ?? 0) > 0 || (data?.changed ?? 0) > 0) {
        router.refresh();
      }
    }
  });
  const executeRef = React.useRef(execute);
  React.useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  React.useEffect(() => {
    const folder = FOLDER_BY_PATH[pathname];
    if (!folder) return;
    const last = lastSyncedRef.current[folder] ?? 0;
    if (Date.now() - last < MIN_REFETCH_MS) return;
    lastSyncedRef.current[folder] = Date.now();
    executeRef.current({ folder });
  }, [pathname]);

  return null;
}
