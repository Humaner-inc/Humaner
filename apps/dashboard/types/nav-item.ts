import type { LucideIcon } from '@humaner/shared/icons';

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  adminOnly?: boolean;
  icon: LucideIcon;
};
