'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import {
  getDashboardSectionForPath,
  getVisibleDashboardSections,
  type DashboardSection,
  type DashboardSectionId
} from '@/constants/dashboard-sections';
import type { ProfileDto } from '@/types/dtos/profile-dto';

type DashboardSectionContextValue = {
  profile: ProfileDto;
  sections: DashboardSection[];
  // section whose sidebar is shown — sticks to the last one on unsectioned pages
  activeSection: DashboardSectionId;
  // true only when the current path belongs to activeSection
  pathInSection: boolean;
};

const DashboardSectionContext =
  React.createContext<DashboardSectionContextValue | null>(null);

export function DashboardSectionProvider({
  profile,
  children
}: {
  profile: ProfileDto;
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname() ?? '';
  const sections = React.useMemo(
    () => getVisibleDashboardSections(profile),
    [profile]
  );
  const pathSection = getDashboardSectionForPath(pathname);
  const fallback = sections[0]?.id ?? 'overview';
  const [lastSection, setLastSection] = React.useState<DashboardSectionId>(
    pathSection ?? fallback
  );

  React.useEffect(() => {
    if (pathSection) setLastSection(pathSection);
  }, [pathSection]);

  const value = React.useMemo<DashboardSectionContextValue>(
    () => ({
      profile,
      sections,
      activeSection: pathSection ?? lastSection,
      pathInSection: pathSection !== null
    }),
    [profile, sections, pathSection, lastSection]
  );

  return (
    <DashboardSectionContext.Provider value={value}>
      {children}
    </DashboardSectionContext.Provider>
  );
}

export function useDashboardSection(): DashboardSectionContextValue {
  const context = React.useContext(DashboardSectionContext);
  if (!context) {
    throw new Error(
      'useDashboardSection must be used within a DashboardSectionProvider.'
    );
  }
  return context;
}

export function useDashboardSectionOptional(): DashboardSectionContextValue | null {
  return React.useContext(DashboardSectionContext);
}
