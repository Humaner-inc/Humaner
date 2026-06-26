'use client';

import {
  BuildingIcon,
  GraduationCapIcon,
  HeartPulse,
  ShoppingBag,
  type LucideIcon
} from '@humaner/shared/icons';

import type { IndustryIconKey } from './industries';

export const INDUSTRY_ICONS: Record<IndustryIconKey, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  'graduation-cap': GraduationCapIcon,
  'heart-pulse': HeartPulse,
  building: BuildingIcon
};

export function getIndustryIcon(key: IndustryIconKey): LucideIcon {
  return INDUSTRY_ICONS[key];
}

export { BuildingIcon, GraduationCapIcon, HeartPulse, ShoppingBag };
