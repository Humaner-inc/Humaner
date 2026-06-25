import { getPathname } from '@/lib/network/get-pathname';

export function getLoginRedirect(): string {
  const callbackUrl = getPathname();

  return callbackUrl
    ? `/api/auth/signin?${new URLSearchParams({ callbackUrl })}`
    : '/api/auth/signin';
}
