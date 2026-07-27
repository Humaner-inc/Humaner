'use client';

import * as React from 'react';

export type OrgMode = 'b2c' | 'b2b' | 'hybrid';

export type OrgModeContext = {
  mode: OrgMode;
  isB2B: boolean;
  isB2C: boolean;
  labels: {
    clusters: string;
    runbooks: string;
    ticketGrouping: string;
    assignment: string;
  };
};

const OrgModeCtx = React.createContext<OrgModeContext>({
  mode: 'b2c',
  isB2B: false,
  isB2C: true,
  labels: {
    clusters: 'Resolution Templates',
    runbooks: 'Runbooks',
    ticketGrouping: 'By urgency',
    assignment: 'First available'
  }
});

const B2C_LABELS = {
  clusters: 'Clusters',
  runbooks: 'Runbooks',
  ticketGrouping: 'By urgency',
  assignment: 'First available'
} as const;

const B2B_LABELS = {
  clusters: 'Clusters',
  runbooks: 'Runbooks',
  ticketGrouping: 'By account',
  assignment: 'Knowledge-area matched'
} as const;

export function OrgModeProvider({
  targetAudience,
  children
}: {
  targetAudience: string | null;
  children: React.ReactNode;
}): React.JSX.Element {
  const value = React.useMemo((): OrgModeContext => {
    const normalized = targetAudience?.toLowerCase();
    const mode: OrgMode =
      normalized === 'b2b' ? 'b2b' : normalized === 'b2c' ? 'b2c' : 'hybrid';

    return {
      mode,
      isB2B: mode === 'b2b' || mode === 'hybrid',
      isB2C: mode === 'b2c' || mode === 'hybrid',
      labels: mode === 'b2b' ? B2B_LABELS : B2C_LABELS
    };
  }, [targetAudience]);

  return <OrgModeCtx.Provider value={value}>{children}</OrgModeCtx.Provider>;
}

export function useOrgMode(): OrgModeContext {
  return React.useContext(OrgModeCtx);
}
