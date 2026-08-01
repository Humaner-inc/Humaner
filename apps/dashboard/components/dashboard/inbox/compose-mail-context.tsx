'use client';

import * as React from 'react';

import { ComposeMailDialog } from '@/components/dashboard/inbox/compose-mail-dialog';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';

type ComposeMailContextValue = {
  inboxes: MailInboxOption[];
  openCompose: (defaultAliasId?: string | null) => void;
};

const ComposeMailContext = React.createContext<ComposeMailContextValue | null>(
  null
);

export function ComposeMailProvider({
  inboxes,
  children
}: {
  inboxes: MailInboxOption[];
  children: React.ReactNode;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [defaultAliasId, setDefaultAliasId] = React.useState<string | null>(
    null
  );

  const openCompose = React.useCallback((aliasId?: string | null) => {
    setDefaultAliasId(aliasId ?? null);
    setOpen(true);
  }, []);

  const value = React.useMemo(
    () => ({ inboxes, openCompose }),
    [inboxes, openCompose]
  );

  return (
    <ComposeMailContext.Provider value={value}>
      {children}
      <ComposeMailDialog
        open={open}
        onOpenChange={setOpen}
        inboxes={inboxes}
        defaultAliasId={defaultAliasId}
      />
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
