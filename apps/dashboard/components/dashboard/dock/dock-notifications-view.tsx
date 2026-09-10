'use client';

import * as React from 'react';
import { BellIcon, Trash2Icon } from '@humaner/shared/icons';

import { FeatureIntroEmpty } from '@/components/dashboard/desk/feature-intro-empty';
import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { useDockNotifications } from '@/components/dashboard/dock/dock-notifications-context';
import { GroupedNotifications } from '@/components/dashboard/notifications/grouped-notifications';
import { Button } from '@/components/ui/button';

export function DockNotificationsView(): React.JSX.Element {
  const { visibleNotifications, markSeen, dismissOne, dismissAll } =
    useDockNotifications();
  const { closeDock } = useDashboardDock();

  React.useEffect(() => {
    markSeen();
  }, [markSeen]);

  if (visibleNotifications.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-5">
        <FeatureIntroEmpty
          compact
          icon={<BellIcon strokeWidth={1.25} />}
          title="You're all caught up"
          description="No new mail or assigned threads."
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <GroupedNotifications
        notifications={visibleNotifications}
        onNavigate={closeDock}
        onDismiss={dismissOne}
        headerAction={
          dismissAll ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:bg-muted/60 hover:text-destructive"
              aria-label="Clear all notifications"
              onClick={dismissAll}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          ) : null
        }
      />
    </div>
  );
}
