import type { LucideIcon } from '@humaner/shared/icons';

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  /** Humaner platform operator (Role.ADMIN in DB). */
  adminOnly?: boolean;
  /** Workspace owner / payer only. */
  ownerOnly?: boolean;
  /** Teammate page access key. */
  pageKey?: string;
  icon: LucideIcon;
};
