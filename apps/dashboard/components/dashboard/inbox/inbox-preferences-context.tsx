'use client';

import * as React from 'react';

type InboxPreferences = {
  autoSuggestReplies: boolean;
};

const InboxPreferencesContext = React.createContext<InboxPreferences>({
  autoSuggestReplies: true
});

export function InboxPreferencesProvider({
  autoSuggestReplies,
  children
}: InboxPreferences & {
  children: React.ReactNode;
}): React.JSX.Element {
  const value = React.useMemo(
    () => ({ autoSuggestReplies }),
    [autoSuggestReplies]
  );

  return (
    <InboxPreferencesContext.Provider value={value}>
      {children}
    </InboxPreferencesContext.Provider>
  );
}

export function useInboxPreferences(): InboxPreferences {
  return React.useContext(InboxPreferencesContext);
}
