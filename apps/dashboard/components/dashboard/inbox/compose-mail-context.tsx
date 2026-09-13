'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { ComposeMailDialog } from '@/components/dashboard/inbox/compose-mail-dialog';
import { Routes } from '@/constants/routes';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { toPublicPathname } from '@/lib/routes/public-pathname';

export type ComposeMailDraft = {
  to?: string;
  subject?: string;
  body?: string;
  title?: string;
};

type ComposeMailContextValue = {
  inboxes: MailInboxOption[];
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
  children
}: {
  inboxes: MailInboxOption[];
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
      setDefaultAliasId(aliasId ?? null);
      setDraft(nextDraft ?? null);
      setOpen(true);
    },
    []
  );

  const closeCompose = React.useCallback(() => {
    setOpen(false);
    setDraft(null);
  }, []);

  const value = React.useMemo(
    () => ({
      inboxes,
      composeOpen: open,
      composeInPanel,
      defaultAliasId,
      draft,
      openCompose,
      closeCompose
    }),
    [
      inboxes,
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
