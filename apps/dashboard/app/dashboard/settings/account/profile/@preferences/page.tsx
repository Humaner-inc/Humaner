import * as React from 'react';

import { PreferencesCard } from '@/components/dashboard/settings/account/profile/preferences-card';
import { getPreferences } from '@/data/account/get-preferences';

export default async function PreferencesPage(): Promise<React.JSX.Element> {
  const preferences = await getPreferences();
  return <PreferencesCard preferences={preferences} />;
}
