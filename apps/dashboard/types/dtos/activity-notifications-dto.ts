export type DeskNotificationUrgency = 'HIGH' | 'MEDIUM' | 'LOW';

export type ActivityChannelPrefs = {
  inApp: boolean;
  email: boolean;
};

export type DeskActivityNotificationPrefs = ActivityChannelPrefs & {
  /** Urgencies that trigger notifications. Empty = none. */
  urgencies: DeskNotificationUrgency[];
};

export type MailActivityNotificationPrefs = ActivityChannelPrefs & {
  /**
   * Tag IDs that trigger notifications.
   * Empty = all tags (when at least one channel is on).
   */
  tagIds: string[];
};

export type ActivityNotificationsDto = {
  desk: DeskActivityNotificationPrefs;
  mail: MailActivityNotificationPrefs;
};

export type ActivityNotificationMailTagOption = {
  id: string;
  name: string;
  color: string;
};
