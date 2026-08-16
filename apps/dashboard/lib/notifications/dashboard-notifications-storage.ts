const DISMISSED_IDS_KEY = 'humaner-dashboard-notifications-dismissed';
const LAST_SEEN_AT_KEY = 'humaner-dashboard-notifications-last-seen-at';

function readDismissedIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(DISMISSED_IDS_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((value) => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

function writeDismissedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      DISMISSED_IDS_KEY,
      JSON.stringify(Array.from(ids))
    );
  } catch {
    // ignore storage errors
  }
}

function readLastSeenAt(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(LAST_SEEN_AT_KEY);
  } catch {
    return null;
  }
}

function writeLastSeenAt(value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LAST_SEEN_AT_KEY, value);
  } catch {
    // ignore storage errors
  }
}

export function loadDashboardNotificationState(): {
  dismissedIds: Set<string>;
  lastSeenAt: string | null;
} {
  return {
    dismissedIds: readDismissedIds(),
    lastSeenAt: readLastSeenAt()
  };
}

export function markDashboardNotificationsSeen(): string {
  const seenAt = new Date().toISOString();
  writeLastSeenAt(seenAt);
  return seenAt;
}

export function dismissDashboardNotifications(ids: string[]): Set<string> {
  const dismissedIds = readDismissedIds();
  for (const id of ids) {
    dismissedIds.add(id);
  }
  writeDismissedIds(dismissedIds);
  return dismissedIds;
}

export function dismissAllDashboardNotifications(ids: string[]): Set<string> {
  return dismissDashboardNotifications(ids);
}

export function isDashboardNotificationUnread(
  notification: { id: string; createdAt: string },
  state: { dismissedIds: Set<string>; lastSeenAt: string | null }
): boolean {
  if (state.dismissedIds.has(notification.id)) {
    return false;
  }

  if (!state.lastSeenAt) {
    return true;
  }

  return (
    new Date(notification.createdAt).getTime() >
    new Date(state.lastSeenAt).getTime()
  );
}
