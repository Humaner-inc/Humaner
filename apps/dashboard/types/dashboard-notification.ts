import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

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
  title: string;
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
