const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const;

function applyTime(date: Date, hour: number, minute: number): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function parseClock(raw: string): { hour: number; minute: number } | null {
  const match = raw
    .toLowerCase()
    .match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour > 24 || minute > 59) {
    return null;
  }

  const meridiem = match[3]?.replace(/\./g, '');
  if (meridiem === 'pm' && hour < 12) {
    hour += 12;
  }
  if (meridiem === 'am' && hour === 12) {
    hour = 0;
  }
  if (!meridiem && hour === 24) {
    hour = 0;
  }

  return { hour, minute };
}

/** Resolve "this Saturday at 2pm" / ISO datetimes for Companion calendar creates. */
export function parseCalendarWhen(raw: string, now = new Date()): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (/\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const iso = new Date(trimmed);
    return Number.isNaN(iso.getTime()) ? null : iso;
  }

  const lower = trimmed.toLowerCase();
  const clock = parseClock(lower) ?? { hour: 9, minute: 0 };
  let daysAhead = 0;

  if (/\btomorrow\b/.test(lower)) {
    daysAhead = 1;
  } else if (!/\btoday\b/.test(lower)) {
    const weekday = WEEKDAYS.findIndex((day) => lower.includes(day));
    if (weekday >= 0) {
      const current = now.getDay();
      daysAhead = weekday - current;
      if (daysAhead < 0) {
        daysAhead += 7;
      }
    } else if (!parseClock(lower)) {
      const fallback = new Date(trimmed);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
  }

  const start = new Date(now);
  start.setDate(start.getDate() + daysAhead);
  const atTime = applyTime(start, clock.hour, clock.minute);
  if (daysAhead === 0 && atTime <= now) {
    atTime.setDate(atTime.getDate() + 7);
  }

  return atTime;
}
