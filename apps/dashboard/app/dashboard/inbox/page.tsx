import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';

export default function InboxPage(): never {
  redirect(Routes.InboxAll);
}
