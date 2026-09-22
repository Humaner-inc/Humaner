'use client';

import * as React from 'react';

type InboxPreferences = {
  autoSuggestReplies: boolean;
};

const InboxPreferencesContext = React.createContext<InboxPreferences>({
  autoSuggestReplies: true
});

const InboxPreferencesSetterContext = React.createContext<
  ((value: boolean) => void) | null
>(null);

export function InboxPreferencesProvider({
  autoSuggestReplies = true,
  children
}: Partial<InboxPreferences> & {
  children: React.ReactNode;
}): React.JSX.Element {
  const [suggest, setSuggest] = React.useState(autoSuggestReplies);
  const value = React.useMemo(
    () => ({ autoSuggestReplies: suggest }),
    [suggest]
  );

  return (
    <InboxPreferencesSetterContext.Provider value={setSuggest}>
      <InboxPreferencesContext.Provider value={value}>
        {children}
      </InboxPreferencesContext.Provider>
    </InboxPreferencesSetterContext.Provider>
  );
}

export function InboxPreferencesSync({
  autoSuggestReplies
}: InboxPreferences): null {
  const setSuggest = React.useContext(InboxPreferencesSetterContext);

  React.useEffect(() => {
    setSuggest?.(autoSuggestReplies);
  }, [autoSuggestReplies, setSuggest]);

  return null;
}

export function useInboxPreferences(): InboxPreferences {
  return React.useContext(InboxPreferencesContext);
}
