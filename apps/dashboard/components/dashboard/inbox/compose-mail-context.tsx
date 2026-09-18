'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { ComposeMailDialog } from '@/components/dashboard/inbox/compose-mail-dialog';
import { Routes } from '@/constants/routes';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { loadComposeDraft } from '@/lib/inbox/compose-draft-storage';
import { toPublicPathname } from '@/lib/routes/public-pathname';

export type ComposeMailDraft = {
  to?: string;
  subject?: string;
  body?: string;
  title?: string;
  aliasId?: string;
};

type ComposeMailContextValue = {
  inboxes: MailInboxOption[];
  workspaceId: string;
  composeOpen: boolean;
  composeInPanel: boolean;
  defaultAliasId: string | null;
  draft: ComposeMailDraft | null;
  openCompose: (
    defaultAliasId?: string | null,
    draft?: ComposeMailDraft | null
  ) => void;
  closeCompose: () => void;
};

const ComposeMailContext = React.createContext<ComposeMailContextValue | null>(
  null
);

function inboxHostsCompose(pathname: string): boolean {
  const path = toPublicPathname(pathname);
  return (
    path === Routes.Inbox ||
    path.startsWith(Routes.InboxAll) ||
    path.startsWith('/inbox/threads')
  );
}

export function ComposeMailProvider({
  inboxes,
  workspaceId,
  children
}: {
  inboxes: MailInboxOption[];
  workspaceId: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [defaultAliasId, setDefaultAliasId] = React.useState<string | null>(
    null
  );
  const [draft, setDraft] = React.useState<ComposeMailDraft | null>(null);
  const composeInPanel = inboxHostsCompose(pathname);

  const openCompose = React.useCallback(
    (aliasId?: string | null, nextDraft?: ComposeMailDraft | null) => {
      const stored = nextDraft ? null : loadComposeDraft(workspaceId);
      setDefaultAliasId(aliasId ?? stored?.aliasId ?? null);
      setDraft(
        nextDraft ??
          (stored
            ? {
                to: stored.to,
                subject: stored.subject,
                body: stored.body,
                aliasId: stored.aliasId,
                title: 'Draft'
              }
            : null)
      );
      setOpen(true);
    },
    [workspaceId]
  );

  const closeCompose = React.useCallback(() => {
    setOpen(false);
    setDraft(null);
  }, []);

  const value = React.useMemo(
    () => ({
      inboxes,
      workspaceId,
      composeOpen: open,
      composeInPanel,
      defaultAliasId,
      draft,
      openCompose,
      closeCompose
    }),
    [
      inboxes,
      workspaceId,
      open,
      composeInPanel,
      defaultAliasId,
      draft,
      openCompose,
      closeCompose
    ]
  );

  return (
    <ComposeMailContext.Provider value={value}>
      {children}
      {open && !composeInPanel ? (
        <ComposeMailDialog
          open={open}
          onOpenChange={setOpen}
          inboxes={inboxes}
          workspaceId={workspaceId}
          defaultAliasId={defaultAliasId}
          draft={draft}
        />
      ) : null}
    </ComposeMailContext.Provider>
  );
}

export function useComposeMail(): ComposeMailContextValue {
  const context = React.useContext(ComposeMailContext);
  if (!context) {
    throw new Error('useComposeMail must be used within ComposeMailProvider');
  }
  return context;
}

export function useComposeMailOptional(): ComposeMailContextValue | null {
  return React.useContext(ComposeMailContext);
}
