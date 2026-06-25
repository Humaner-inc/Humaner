'use client';

import {
  DumbbellIcon,
  GraduationCapIcon,
  PlaneIcon,
  StoreIcon,
  type LucideIcon
} from '@humaner/shared/icons';

import type { IndustryIconKey } from './industries';

export const INDUSTRY_ICONS: Record<IndustryIconKey, LucideIcon> = {
  store: StoreIcon,
  'graduation-cap': GraduationCapIcon,
  dumbbell: DumbbellIcon,
  airplane: PlaneIcon
};

export function getIndustryIcon(key: IndustryIconKey): LucideIcon {
  return INDUSTRY_ICONS[key];
}

export { DumbbellIcon, GraduationCapIcon, PlaneIcon, StoreIcon };
