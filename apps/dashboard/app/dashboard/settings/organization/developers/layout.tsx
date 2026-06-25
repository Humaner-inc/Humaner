import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';

export default function DevelopersLayout(): never {
  redirect(`${Routes.Integrations}#rest-api`);
}
