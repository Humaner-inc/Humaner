'use client';

import * as React from 'react';

import { useDashboardNotifications } from '@/hooks/use-dashboard-notifications';
import type {
  DashboardNotification,
  DashboardNotificationAssignee
} from '@/types/dashboard-notification';

type DockNotificationsContextValue = {
  visibleNotifications: DashboardNotification[];
  unreadCount: number;
  teamMembers: DashboardNotificationAssignee[];
  currentUserId: string;
  markSeen: () => void;
  dismissAll: () => void;
};

const DockNotificationsContext =
  React.createContext<DockNotificationsContextValue | null>(null);

export function useDockNotifications(): DockNotificationsContextValue {
  const value = React.useContext(DockNotificationsContext);
  if (!value) {
    throw new Error(
      'useDockNotifications must be used within DockNotificationsProvider'
    );
  }
  return value;
}

export function DockNotificationsProvider({
  notifications,
  teamMembers,
  currentUserId,
  children
}: {
  notifications: DashboardNotification[];
  teamMembers: DashboardNotificationAssignee[];
  currentUserId: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const notifs = useDashboardNotifications(notifications);

  const value = React.useMemo(
    () => ({
      visibleNotifications: notifs.visibleNotifications,
      unreadCount: notifs.unreadCount,
      teamMembers,
      currentUserId,
      markSeen: notifs.markSeen,
      dismissAll: notifs.dismissAll
    }),
    [
      notifs.visibleNotifications,
      notifs.unreadCount,
      notifs.markSeen,
      notifs.dismissAll,
      teamMembers,
      currentUserId
    ]
  );

  return (
    <DockNotificationsContext.Provider value={value}>
      {children}
    </DockNotificationsContext.Provider>
  );
}
