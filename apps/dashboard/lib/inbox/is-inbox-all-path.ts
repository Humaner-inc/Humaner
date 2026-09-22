import { Routes } from '@/constants/routes';

export function isInboxAllPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split('?')[0] ?? '';
  return path === Routes.InboxAll || path === Routes.Inbox;
}
