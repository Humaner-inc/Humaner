'use client';

import * as React from 'react';

export type DockMode =
  | 'ask'
  | 'help'
  | 'notifications'
  | 'report-bug'
  | 'feedback'
  | 'team'
  | null;

export type TeamDockTab = 'notes' | 'messages';

export type TeamNotesFocus = {
  threadId: string;
  subject?: string | null;
  sharedNoteDraft?: string | null;
};

type DockOpenOptions = {
  teamTab?: TeamDockTab;
  notesFocus?: TeamNotesFocus | null;
};

type DashboardDockContextValue = {
  activeMode: DockMode;
  teamTab: TeamDockTab;
  notesFocus: TeamNotesFocus | null;
  openDock: (mode: NonNullable<DockMode>, options?: DockOpenOptions) => void;
  closeDock: () => void;
  toggleDock: (mode: NonNullable<DockMode>, options?: DockOpenOptions) => void;
  setNotesFocus: (focus: TeamNotesFocus | null) => void;
};

const DashboardDockContext =
  React.createContext<DashboardDockContextValue | null>(null);

export function useDashboardDockOptional(): DashboardDockContextValue | null {
  return React.useContext(DashboardDockContext);
}

export function useDashboardDock(): DashboardDockContextValue {
  const value = useDashboardDockOptional();
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
  const [teamTab, setTeamTab] = React.useState<TeamDockTab>('messages');
  const [notesFocus, setNotesFocus] = React.useState<TeamNotesFocus | null>(
    null
  );

  const applyNotesFocus = React.useCallback((focus: TeamNotesFocus | null) => {
    setNotesFocus((current) => {
      if (current === focus) return current;
      if (
        current?.threadId === focus?.threadId &&
        current?.subject === focus?.subject &&
        current?.sharedNoteDraft === focus?.sharedNoteDraft
      ) {
        return current;
      }
      return focus;
    });
  }, []);

  const openDock = React.useCallback(
    (mode: NonNullable<DockMode>, options?: DockOpenOptions) => {
      if (options?.teamTab) setTeamTab(options.teamTab);
      if (options?.notesFocus !== undefined) {
        applyNotesFocus(options.notesFocus);
      }
      setActiveMode(mode);
    },
    [applyNotesFocus]
  );

  const closeDock = React.useCallback(() => {
    setActiveMode(null);
  }, []);

  const toggleDock = React.useCallback(
    (mode: NonNullable<DockMode>, options?: DockOpenOptions) => {
      if (options?.teamTab) setTeamTab(options.teamTab);
      if (options?.notesFocus !== undefined) {
        applyNotesFocus(options.notesFocus);
      }
      setActiveMode((current) => (current === mode ? null : mode));
    },
    [applyNotesFocus]
  );

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
    () => ({
      activeMode,
      teamTab,
      notesFocus,
      openDock,
      closeDock,
      toggleDock,
      setNotesFocus: applyNotesFocus
    }),
    [
      activeMode,
      teamTab,
      notesFocus,
      openDock,
      closeDock,
      toggleDock,
      applyNotesFocus
    ]
  );

  return (
    <DashboardDockContext.Provider value={value}>
      {children}
    </DashboardDockContext.Provider>
  );
}
