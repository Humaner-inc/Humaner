import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';

export default function OrganizationInformationLayout(): never {
  redirect(Routes.OrganizationWorkspace);
}
