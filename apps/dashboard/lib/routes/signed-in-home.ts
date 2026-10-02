import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';

/** Cloud lands on the mailbox overview. Self-Host keeps the organization home. */
export function getSignedInHomePath(): string {
  return isOssDeployment() ? Routes.Home : Routes.Overview;
}

/**
 * App homes that unsigned visitors should leave without a bounce `callbackUrl`.
 * Keeps `/auth/login` clean and avoids poisoning Auth.js with `/overview`.
 */
export function isDefaultSignedInHomePath(pathname: string): boolean {
  const path = pathname.split('?')[0]?.split('#')[0] ?? pathname;
  return (
    path === '/' ||
    path === '/overview' ||
    path === '/inbox' ||
    path === '/inbox/all' ||
    path === '/organization' ||
    path === '/organization/overview' ||
    path === '/dashboard/overview' ||
    path === '/dashboard/home'
  );
}
