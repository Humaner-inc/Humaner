import { isOssDeployment } from '@/lib/deployment-mode';
import type {
  DashboardNotification,
  DashboardNotificationKind
} from '@/types/dashboard-notification';

export type NotificationGroupConfig = {
  kind: DashboardNotificationKind;
  noun: string;
  nounPlural: string;
  context: string;
  cloudOnly?: boolean;
};

export const NOTIFICATION_GROUPS: NotificationGroupConfig[] = [
  {
    kind: 'mail',
    noun: 'unread mail',
    nounPlural: 'unread mails',
    context: 'in the inbox',
    cloudOnly: true
  },
  {
    kind: 'task',
    noun: 'assigned thread',
    nounPlural: 'assigned threads',
    context: ''
  },
  {
    kind: 'ticket',
    noun: 'ticket',
    nounPlural: 'tickets',
    context: 'open'
  },
  {
    kind: 'api_key',
    noun: 'API key',
    nounPlural: 'API keys',
    context: 'expiring'
  },
  {
    kind: 'loop',
    noun: 'loop',
    nounPlural: 'loops',
    context: 'to review'
  },
  {
    kind: 'billing',
    noun: 'billing update',
    nounPlural: 'billing updates',
    context: '',
    cloudOnly: true
  }
];

export type NotificationGroup = NotificationGroupConfig & {
  items: DashboardNotification[];
};

export function visibleNotificationGroups(): NotificationGroupConfig[] {
  const oss = isOssDeployment();
  return NOTIFICATION_GROUPS.filter((group) => !oss || !group.cloudOnly);
}

export function groupDashboardNotifications(
  notifications: DashboardNotification[]
): NotificationGroup[] {
  return visibleNotificationGroups()
    .map((section) => ({
      ...section,
      items: notifications.filter((item) => item.kind === section.kind)
    }))
    .filter((section) => section.items.length > 0);
}

export function notificationGroupSummary(group: NotificationGroup): {
  countLabel: string;
  context: string;
} {
  const noun = group.items.length === 1 ? group.noun : group.nounPlural;
  return {
    countLabel: `${group.items.length} ${noun}`,
    context: group.context
  };
}
