'use client';

import * as React from 'react';

export type DockMode =
  | 'ask'
  | 'help'
  | 'notifications'
  | 'report-bug'
  | 'feedback'
  | null;

type DashboardDockContextValue = {
  activeMode: DockMode;
  openDock: (mode: NonNullable<DockMode>) => void;
  closeDock: () => void;
  toggleDock: (mode: NonNullable<DockMode>) => void;
};

const DashboardDockContext =
  React.createContext<DashboardDockContextValue | null>(null);

export function useDashboardDock(): DashboardDockContextValue {
  const value = React.useContext(DashboardDockContext);
  if (!value) {
    throw new Error(
      'useDashboardDock must be used within DashboardDockProvider'
    );
  }
  return value;
}

export function DashboardDockProvider({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [activeMode, setActiveMode] = React.useState<DockMode>(null);

  const openDock = React.useCallback((mode: NonNullable<DockMode>) => {
    setActiveMode(mode);
  }, []);

  const closeDock = React.useCallback(() => {
    setActiveMode(null);
  }, []);

  const toggleDock = React.useCallback((mode: NonNullable<DockMode>) => {
    setActiveMode((current) => (current === mode ? null : mode));
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && activeMode) {
        setActiveMode(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMode]);

  const value = React.useMemo(
    () => ({ activeMode, openDock, closeDock, toggleDock }),
    [activeMode, openDock, closeDock, toggleDock]
  );

  return (
    <DashboardDockContext.Provider value={value}>
      {children}
    </DashboardDockContext.Provider>
  );
}
