'use client';

import * as React from 'react';

import {
  dismissAllDashboardNotifications,
  dismissDashboardNotifications,
  isDashboardNotificationUnread,
  loadDashboardNotificationState,
  markDashboardNotificationsSeen
} from '@/lib/notifications/dashboard-notifications-storage';
import type { DashboardNotification } from '@/types/dashboard-notification';

export function useDashboardNotifications(
  notifications: DashboardNotification[]
): {
  visibleNotifications: DashboardNotification[];
  unreadCount: number;
  markSeen: () => void;
  dismissOne: (id: string) => void;
  dismissAll: () => void;
} {
  const [state, setState] = React.useState<{
    dismissedIds: Set<string>;
    lastSeenAt: string | null;
  }>({
    dismissedIds: new Set(),
    lastSeenAt: null
  });
  const [storageReady, setStorageReady] = React.useState(false);

  React.useEffect(() => {
    setState(loadDashboardNotificationState());
    setStorageReady(true);
  }, []);

  const visibleNotifications = React.useMemo(
    () => notifications.filter((item) => !state.dismissedIds.has(item.id)),
    [notifications, state.dismissedIds]
  );

  const unreadCount = React.useMemo(() => {
    if (!storageReady) {
      return notifications.filter((item) => !state.dismissedIds.has(item.id))
        .length;
    }

    return visibleNotifications.filter((item) =>
      isDashboardNotificationUnread(item, state)
    ).length;
  }, [notifications, visibleNotifications, state, storageReady]);

  const markSeen = React.useCallback(() => {
    const lastSeenAt = markDashboardNotificationsSeen();
    setState((current) => ({ ...current, lastSeenAt }));
  }, []);

  const dismissOne = React.useCallback((id: string) => {
    const dismissedIds = dismissDashboardNotifications([id]);
    setState((current) => ({ ...current, dismissedIds }));
  }, []);

  const dismissAll = React.useCallback(() => {
    const dismissedIds = dismissAllDashboardNotifications(
      visibleNotifications.map((item) => item.id)
    );
    setState((current) => ({ ...current, dismissedIds }));
  }, [visibleNotifications]);

  return {
    visibleNotifications,
    unreadCount,
    markSeen,
    dismissOne,
    dismissAll
  };
}
