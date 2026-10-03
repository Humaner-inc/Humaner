import type * as React from 'react';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Globe } from '@phosphor-icons/react/dist/ssr/Globe';
import { Stack } from '@phosphor-icons/react/dist/ssr/Stack';
import { Tray } from '@phosphor-icons/react/dist/ssr/Tray';
import { Warehouse } from '@phosphor-icons/react/dist/ssr/Warehouse';

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
  workspace: Warehouse,
  utilities: Stack
};
