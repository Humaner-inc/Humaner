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

export function calendarPath(date: Date, view: CalendarView): string {
  const params = new URLSearchParams({
    date: formatCalendarDateParam(date)
  });
  if (view !== 'week') {
    params.set('view', view);
  }
  return `${Routes.Calendar}?${params.toString()}`;
}
