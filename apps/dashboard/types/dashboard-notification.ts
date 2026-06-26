export type DashboardNotificationKind =
  | 'plan_limit'
  | 'human_desk'
  | 'workspace_ticket'
  | 'billing'
  | 'history_highlight';

export type DashboardNotificationSeverity =
  | 'info'
  | 'warning'
  | 'critical'
  | 'success';

export type DashboardNotificationAction = 'open_support_tickets';

export type DashboardNotification = {
  id: string;
  kind: DashboardNotificationKind;
  title: string;
  description: string;
  href: string;
  severity: DashboardNotificationSeverity;
  tag?: string;
  createdAt: string;
  action?: DashboardNotificationAction;
};

export type DashboardNotificationsSnapshot = {
  items: DashboardNotification[];
  unreadCount: number;
};
