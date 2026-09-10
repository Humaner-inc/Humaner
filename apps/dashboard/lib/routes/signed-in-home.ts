import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';

/** Cloud lands in the inbox. Self-Host keeps the organization home. */
export function getSignedInHomePath(): string {
  return isOssDeployment() ? Routes.Home : Routes.InboxAll;
}
