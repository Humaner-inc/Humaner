import type * as React from 'react';
import { DatedCalendarIcon } from '@humaner/shared/dated-calendar-icon';
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
  calendar: DatedCalendarIcon,
  inbox: Tray,
  workspace: Warehouse,
  utilities: Stack
};
