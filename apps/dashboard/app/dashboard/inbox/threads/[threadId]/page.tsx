import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';

export default async function InboxThreadPage({
  params,
  searchParams
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ panel?: string; notes?: string }>;
}): Promise<never> {
  const [{ threadId }, query] = await Promise.all([params, searchParams]);
  const next = new URLSearchParams({ thread: threadId });
  if (query.panel) {
    next.set('panel', query.panel);
  }
  if (query.notes) {
    next.set('notes', query.notes);
  }
  redirect(`${Routes.InboxAll}?${next.toString()}`);
}
