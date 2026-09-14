import { describe, expect, it } from 'vitest';

import { parseCalendarWhen } from '@/lib/calendar/parse-calendar-when';
import { resolveCompanionTimeZone } from '@/lib/calendar/time-zones';

describe('parseCalendarWhen', () => {
  const mondayAfternoonUtc = new Date('2026-09-14T16:42:00.000Z');

  it('keeps 2pm in Europe/Paris instead of storing 2pm UTC', () => {
    const startsAt = parseCalendarWhen(
      'this Saturday at 2pm',
      mondayAfternoonUtc,
      'Europe/Paris'
    );
    expect(startsAt?.toISOString()).toBe('2026-09-19T12:00:00.000Z');
  });

  it('treats Z-suffixed ISO clock parts as local wall time', () => {
    const startsAt = parseCalendarWhen(
      '2026-09-19T14:00:00.000Z',
      mondayAfternoonUtc,
      'Europe/Paris'
    );
    expect(startsAt?.toISOString()).toBe('2026-09-19T12:00:00.000Z');
  });

  it('respects an explicit numeric offset', () => {
    const startsAt = parseCalendarWhen(
      '2026-09-19T14:00:00+02:00',
      mondayAfternoonUtc,
      'Europe/Paris'
    );
    expect(startsAt?.toISOString()).toBe('2026-09-19T12:00:00.000Z');
  });

  it('parses naive ISO as local wall time', () => {
    const startsAt = parseCalendarWhen(
      '2026-09-19T14:00:00',
      mondayAfternoonUtc,
      'Europe/Paris'
    );
    expect(startsAt?.toISOString()).toBe('2026-09-19T12:00:00.000Z');
  });

  it('uses America/New_York when that is the teammate zone', () => {
    const startsAt = parseCalendarWhen(
      'this Saturday at 2pm',
      mondayAfternoonUtc,
      'America/New_York'
    );
    expect(startsAt?.toISOString()).toBe('2026-09-19T18:00:00.000Z');
  });
});

describe('resolveCompanionTimeZone', () => {
  it('prefers the saved timezone over the browser', () => {
    expect(resolveCompanionTimeZone('Europe/Paris', 'UTC')).toBe(
      'Europe/Paris'
    );
  });

  it('falls back to the browser when none is saved', () => {
    expect(resolveCompanionTimeZone(null, 'America/New_York')).toBe(
      'America/New_York'
    );
  });
});
