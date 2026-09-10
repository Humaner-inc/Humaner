import type {
  ActivityNotificationsDto,
  DeskNotificationUrgency
} from '@/types/dtos/activity-notifications-dto';

const DESK_URGENCIES: DeskNotificationUrgency[] = ['HIGH', 'MEDIUM', 'LOW'];

export const DEFAULT_ACTIVITY_NOTIFICATION_PREFERENCES: ActivityNotificationsDto =
  {
    desk: {
      inApp: true,
      email: false,
      urgencies: [...DESK_URGENCIES]
    },
    mail: {
      inApp: true,
      email: false,
      tagIds: []
    }
  };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function parseDeskUrgencies(value: unknown): DeskNotificationUrgency[] {
  if (!Array.isArray(value)) {
    return [...DESK_URGENCIES];
  }

  const allowed = new Set<string>(DESK_URGENCIES);
  const next: DeskNotificationUrgency[] = [];
  for (const item of value) {
    if (typeof item === 'string' && allowed.has(item)) {
      next.push(item as DeskNotificationUrgency);
    }
  }
  return next;
}

function parseTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

export function parseActivityNotificationPreferences(
  raw: unknown
): ActivityNotificationsDto {
  const defaults = DEFAULT_ACTIVITY_NOTIFICATION_PREFERENCES;
  if (!isRecord(raw)) {
    return {
      desk: { ...defaults.desk, urgencies: [...defaults.desk.urgencies] },
      mail: { ...defaults.mail, tagIds: [...defaults.mail.tagIds] }
    };
  }

  const desk = isRecord(raw.desk) ? raw.desk : {};
  const mail = isRecord(raw.mail) ? raw.mail : {};

  return {
    desk: {
      inApp: parseBoolean(desk.inApp, defaults.desk.inApp),
      email: parseBoolean(desk.email, defaults.desk.email),
      urgencies: parseDeskUrgencies(desk.urgencies)
    },
    mail: {
      inApp: parseBoolean(mail.inApp, defaults.mail.inApp),
      email: parseBoolean(mail.email, defaults.mail.email),
      tagIds: parseTagIds(mail.tagIds)
    }
  };
}

export function shouldNotifyDeskInApp(
  prefs: ActivityNotificationsDto,
  urgency: string | null | undefined
): boolean {
  if (!prefs.desk.inApp) {
    return false;
  }
  if (!urgency) {
    return prefs.desk.urgencies.length > 0;
  }
  return prefs.desk.urgencies.includes(urgency as DeskNotificationUrgency);
}

export function shouldNotifyMailInApp(
  prefs: ActivityNotificationsDto,
  tagId: string | null | undefined
): boolean {
  if (!prefs.mail.inApp) {
    return false;
  }
  // Empty tagIds = all tags
  if (prefs.mail.tagIds.length === 0) {
    return true;
  }
  if (!tagId) {
    return false;
  }
  return prefs.mail.tagIds.includes(tagId);
}
