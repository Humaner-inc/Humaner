import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';

/** Removed: workspace settings live under Account → Workspace Settings. */
export default function WorkspacePage(): never {
  redirect(Routes.OrganizationInformation);
}
