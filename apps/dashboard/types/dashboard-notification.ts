import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

export type DashboardNotificationKind =
  | 'ticket'
  | 'task'
  | 'mail'
  | 'api_key'
  | 'loop'
  | 'billing';

export type DashboardNotificationSeverity =
  | 'info'
  | 'warning'
  | 'critical'
  | 'success';

export type DashboardNotificationAction = 'open_support_tickets';

export type DashboardNotificationHandoff = {
  ticketId: string;
  status: HandoffTicketStatus;
  urgency: HandoffTicketUrgency;
  assigneeId: string | null;
};

export type DashboardNotificationAssignee = {
  id: string;
  name: string;
  image: string | null;
  email: string | null;
};

export type DashboardNotification = {
  id: string;
  kind: DashboardNotificationKind;
  /** Muted lead-in, e.g. "Password reset" */
  title: string;
  /** Bold tail, e.g. "high" or "#00042", rendered as [high] / [#00042] */
  emphasis?: string;
  description: string;
  href: string;
  severity: DashboardNotificationSeverity;
  tag?: string;
  createdAt: string;
  action?: DashboardNotificationAction;
  handoff?: DashboardNotificationHandoff;
};

export type DashboardNotificationsSnapshot = {
  items: DashboardNotification[];
  unreadCount: number;
  teamMembers: DashboardNotificationAssignee[];
  currentUserId: string;
};
