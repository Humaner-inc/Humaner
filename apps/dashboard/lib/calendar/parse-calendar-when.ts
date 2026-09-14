const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const;

const IANA_TIME_ZONE = /^[A-Za-z0-9_+\-/]+$/;
const ISO_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/i;

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

export function resolveIanaTimeZone(value?: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed.length > 64 || !IANA_TIME_ZONE.test(trimmed)) {
    return null;
  }
  try {
    Intl.DateTimeFormat('en-US', { timeZone: trimmed }).format(new Date());
    return trimmed;
  } catch {
    return null;
  }
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const map = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  const weekdayKey = (map.weekday ?? 'Sun').slice(0, 3).toLowerCase();
  const weekday = WEEKDAYS.findIndex((day) => day.startsWith(weekdayKey));
  let hour = Number(map.hour);
  if (hour === 24) {
    hour = 0;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    weekday: weekday >= 0 ? weekday : 0
  };
}

function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i++) {
    const parts = zonedParts(new Date(utc), timeZone);
    const got = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      0
    );
    const want = Date.UTC(year, month - 1, day, hour, minute, 0);
    const diff = got - want;
    if (diff === 0) {
      return new Date(utc);
    }
    utc -= diff;
  }
  return new Date(utc);
}

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

function parseIsoDateTime(raw: string, timeZone: string | null): Date | null {
  const match = ISO_DATE_TIME.exec(raw);
  if (!match) {
    const iso = new Date(raw);
    return Number.isNaN(iso.getTime()) ? null : iso;
  }

  const offset = match[7];
  const hasNumericOffset = Boolean(offset && offset.toUpperCase() !== 'Z');
  if (!timeZone || hasNumericOffset) {
    const iso = new Date(raw);
    return Number.isNaN(iso.getTime()) ? null : iso;
  }

  return zonedWallTimeToUtc(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    timeZone
  );
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number
) {
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate()
  };
}

export function formatCompanionClock(
  now = new Date(),
  timeZone?: string | null
): string {
  const tz = resolveIanaTimeZone(timeZone) ?? 'UTC';
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'shortOffset'
  }).format(now);
  return `${formatted} (${tz})`;
}

export function formatCalendarWhenLocal(
  date: Date,
  timeZone?: string | null
): string {
  const tz = resolveIanaTimeZone(timeZone);
  return new Intl.DateTimeFormat('en-US', {
    ...(tz ? { timeZone: tz } : {}),
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).format(date);
}

/** Resolve "this Saturday at 2pm" / ISO datetimes for Companion calendar creates. */
export function parseCalendarWhen(
  raw: string,
  now = new Date(),
  timeZone?: string | null
): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const tz = resolveIanaTimeZone(timeZone);

  if (/\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return parseIsoDateTime(trimmed, tz);
  }

  const lower = trimmed.toLowerCase();
  const clock = parseClock(lower) ?? { hour: 9, minute: 0 };
  let daysAhead = 0;

  if (/\btomorrow\b/.test(lower)) {
    daysAhead = 1;
  } else if (!/\btoday\b/.test(lower)) {
    const weekday = WEEKDAYS.findIndex((day) => lower.includes(day));
    if (weekday >= 0) {
      const current = tz ? zonedParts(now, tz).weekday : now.getDay();
      daysAhead = weekday - current;
      if (daysAhead < 0) {
        daysAhead += 7;
      }
    } else if (!parseClock(lower)) {
      const fallback = new Date(trimmed);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
  }

  if (!tz) {
    const start = new Date(now);
    start.setDate(start.getDate() + daysAhead);
    const atTime = applyTime(start, clock.hour, clock.minute);
    if (daysAhead === 0 && atTime <= now) {
      atTime.setDate(atTime.getDate() + 7);
    }
    return atTime;
  }

  const parts = zonedParts(now, tz);
  let date = addCalendarDays(parts.year, parts.month, parts.day, daysAhead);
  let atTime = zonedWallTimeToUtc(
    date.year,
    date.month,
    date.day,
    clock.hour,
    clock.minute,
    tz
  );
  if (daysAhead === 0 && atTime <= now) {
    date = addCalendarDays(date.year, date.month, date.day, 7);
    atTime = zonedWallTimeToUtc(
      date.year,
      date.month,
      date.day,
      clock.hour,
      clock.minute,
      tz
    );
  }
  return atTime;
}
