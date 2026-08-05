import * as React from 'react';

import { ActivityNotificationsCard } from '@/components/dashboard/settings/account/notifications/activity-notifications-card';
import { getActivityNotifications } from '@/data/account/get-activity-notifications';

export default async function ActivityNotificationsPage(): Promise<React.JSX.Element> {
  const { settings, mailTags } = await getActivityNotifications();
  return (
    <ActivityNotificationsCard
      settings={settings}
      mailTags={mailTags}
    />
  );
}
