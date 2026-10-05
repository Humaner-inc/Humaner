import { redirect } from 'next/navigation';

import {
  resolveWorkspaceSettingsTab,
  workspaceSettingsHref
} from '@/constants/workspace-settings-tabs';

export default async function InboxSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; apps?: string }>;
}): Promise<never> {
  const params = await searchParams;
  const tab = params.tab ? resolveWorkspaceSettingsTab(params.tab) : 'connect';
  const href = workspaceSettingsHref(tab);
  if (!params.apps) {
    redirect(href);
  }
  const separator = href.includes('?') ? '&' : '?';
  redirect(`${href}${separator}apps=${encodeURIComponent(params.apps)}`);
}
