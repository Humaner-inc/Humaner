import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';

export default function InboxAliasesRedirectPage(): never {
  redirect(Routes.InboxSettings);
}
