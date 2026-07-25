import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';

export default function AuditLogsPage(): never {
  redirect(Routes.Security);
}
