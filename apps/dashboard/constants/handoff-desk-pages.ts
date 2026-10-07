import type { DashboardPageKey } from '@/constants/dashboard-pages';

// desk page keys only — support is Role.ADMIN path-gated, not a teammate ACL key
export const HANDOFF_DESK_PAGE_KEYS = [
  'desk',
  'human-desk'
] as const satisfies readonly DashboardPageKey[];

export type HandoffDeskPageKey = (typeof HANDOFF_DESK_PAGE_KEYS)[number];

export function isHandoffDeskPageKey(
  pageKey: DashboardPageKey
): pageKey is HandoffDeskPageKey {
  return (HANDOFF_DESK_PAGE_KEYS as readonly DashboardPageKey[]).includes(
    pageKey
  );
}

export function sharesHandoffDeskAccess(
  allowedPages: readonly string[],
  pageKey: DashboardPageKey
): boolean {
  if (!isHandoffDeskPageKey(pageKey)) {
    return false;
  }
  return HANDOFF_DESK_PAGE_KEYS.some((key) => allowedPages.includes(key));
}
