import { Routes } from '@/constants/routes';

export const CALENDAR_VIEWS = ['day', 'week', 'month'] as const;

export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export function parseCalendarView(value?: string | null): CalendarView {
  if (value === 'day' || value === 'month' || value === 'week') {
    return value;
  }
  return 'week';
}

export function parseCalendarDate(value?: string | null): Date {
  if (!value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatCalendarDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfWeekMonday(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function calendarRange(
  focus: Date,
  view: CalendarView
): { start: Date; end: Date } {
  if (view === 'day') {
    const start = new Date(focus);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (view === 'month') {
    const monthStart = new Date(focus.getFullYear(), focus.getMonth(), 1);
    const start = startOfWeekMonday(monthStart);
    const monthEnd = new Date(focus.getFullYear(), focus.getMonth() + 1, 0);
    const end = startOfWeekMonday(monthEnd);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  const start = startOfWeekMonday(focus);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export const DEFAULT_EVENT_COLOR = '#f85919';

export const CALENDAR_EVENT_COLORS = [
  '#001afc',
  '#226342',
  '#f85919',
  '#aa1f18',
  '#e6b325',
  '#e0e1df',
  '#18181b',
  '#0A0D0D'
] as const;

export function sameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function toLocalDateTimeInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalDateTimeInput(value: string): Date {
  return new Date(value);
}

export function snapMinutes(totalMinutes: number, step = 30): number {
  return Math.round(totalMinutes / step) * step;
}

/** Prefill create: the given day, with the current clock time. */
export function defaultEventWindow(
  day?: Date,
  from = new Date()
): {
  start: Date;
  end: Date;
} {
  const start = new Date(day ?? from);
  start.setHours(from.getHours(), from.getMinutes(), 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return { start, end };
}

export function eventInkColor(hex: string): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return '#fcf4ec';
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return '#fcf4ec';
  const luma = (r * 299 + g * 587 + b * 114) / 1000;
  return luma > 160 ? '#0A0D0D' : '#fcf4ec';
}

export function moveEventKeepingDuration(
  startsAt: Date,
  endsAt: Date,
  day: Date,
  startMinutes: number
): { startsAt: Date; endsAt: Date } {
  const duration = Math.max(
    15 * 60 * 1000,
    endsAt.getTime() - startsAt.getTime()
  );
  const nextStart = new Date(day);
  nextStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  return {
    startsAt: nextStart,
    endsAt: new Date(nextStart.getTime() + duration)
  };
}

export function moveEventToDayKeepClock(
  startsAt: Date,
  endsAt: Date,
  day: Date
): { startsAt: Date; endsAt: Date } {
  return moveEventKeepingDuration(
    startsAt,
    endsAt,
    day,
    startsAt.getHours() * 60 + startsAt.getMinutes()
  );
}

export function calendarPath(date: Date, view: CalendarView): string {
  const params = new URLSearchParams({
    date: formatCalendarDateParam(date)
  });
  if (view !== 'week') {
    params.set('view', view);
  }
  return `${Routes.Calendar}?${params.toString()}`;
}
