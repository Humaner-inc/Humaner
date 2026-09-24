import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';

/** Cloud lands on the mailbox overview. Self-Host keeps the organization home. */
export function getSignedInHomePath(): string {
  return isOssDeployment() ? Routes.Home : Routes.Overview;
}
