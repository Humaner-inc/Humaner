'use client';

import * as React from 'react';

type InboxPreferences = {
  autoSuggestReplies: boolean;
  autoDetectMail: boolean;
};

const InboxPreferencesContext = React.createContext<InboxPreferences>({
  autoSuggestReplies: true,
  autoDetectMail: true
});

const InboxPreferencesSetterContext = React.createContext<{
  setSuggest: (value: boolean) => void;
  setDetect: (value: boolean) => void;
} | null>(null);

export function InboxPreferencesProvider({
  autoSuggestReplies = true,
  autoDetectMail = true,
  children
}: Partial<InboxPreferences> & {
  children: React.ReactNode;
}): React.JSX.Element {
  const [suggest, setSuggest] = React.useState(autoSuggestReplies);
  const [detect, setDetect] = React.useState(autoDetectMail);
  const value = React.useMemo(
    () => ({ autoSuggestReplies: suggest, autoDetectMail: detect }),
    [suggest, detect]
  );
  const setters = React.useMemo(() => ({ setSuggest, setDetect }), []);

  return (
    <InboxPreferencesSetterContext.Provider value={setters}>
      <InboxPreferencesContext.Provider value={value}>
        {children}
      </InboxPreferencesContext.Provider>
    </InboxPreferencesSetterContext.Provider>
  );
}

export function InboxPreferencesSync({
  autoSuggestReplies,
  autoDetectMail
}: InboxPreferences): null {
  const setters = React.useContext(InboxPreferencesSetterContext);

  React.useEffect(() => {
    setters?.setSuggest(autoSuggestReplies);
  }, [autoSuggestReplies, setters]);

  React.useEffect(() => {
    setters?.setDetect(autoDetectMail);
  }, [autoDetectMail, setters]);

  return null;
}

export function useInboxPreferences(): InboxPreferences {
  return React.useContext(InboxPreferencesContext);
}
