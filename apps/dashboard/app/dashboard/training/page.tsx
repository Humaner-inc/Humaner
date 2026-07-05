import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';

/**
 * Training now lives inside Knowledge (see /dashboard/knowledge) — testing
 * an agent only makes sense once it has knowledge to test against. This
 * route just forwards old links/bookmarks to the right place.
 */
export default async function TrainingRedirectPage({
  searchParams
}: {
  searchParams: Promise<{ agent?: string }>;
}): Promise<never> {
  const { agent } = await searchParams;
  redirect(agent ? `${Routes.Knowledge}?agent=${agent}` : Routes.Knowledge);
}
