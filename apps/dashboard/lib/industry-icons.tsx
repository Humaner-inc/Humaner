'use client';

import {
  ActivityIcon,
  MonitorIcon,
  PlaneIcon,
  ShoppingBag,
  type LucideIcon
} from '@humaner/shared/icons';

import type { IndustryIconKey } from './industries';

/** Same glyph set as landing `/industries` (cart, monitor, activity, plane). */
export const INDUSTRY_ICONS: Record<IndustryIconKey, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  monitor: MonitorIcon,
  activity: ActivityIcon,
  plane: PlaneIcon
};

export function getIndustryIcon(key: IndustryIconKey): LucideIcon {
  return INDUSTRY_ICONS[key];
}

export { ActivityIcon, MonitorIcon, PlaneIcon, ShoppingBag };
