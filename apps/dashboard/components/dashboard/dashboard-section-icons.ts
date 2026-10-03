import type * as React from 'react';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Globe } from '@phosphor-icons/react/dist/ssr/Globe';
import { SquaresFour } from '@phosphor-icons/react/dist/ssr/SquaresFour';
import { Tray } from '@phosphor-icons/react/dist/ssr/Tray';
import { Wrench } from '@phosphor-icons/react/dist/ssr/Wrench';

import type { DashboardSectionId } from '@/constants/dashboard-sections';

export type DashboardSectionIcon = React.ComponentType<{
  size?: number;
  weight?: 'regular' | 'fill';
  className?: string;
  'aria-hidden'?: boolean;
}>;

export const DASHBOARD_SECTION_ICONS: Record<
  DashboardSectionId,
  DashboardSectionIcon
> = {
  overview: Globe,
  calendar: CalendarBlank,
  inbox: Tray,
  workspace: SquaresFour,
  utilities: Wrench
};
