import { format } from 'date-fns';

function atMorning(date: Date): Date {
  const next = new Date(date);
  next.setHours(9, 0, 0, 0);
  return next;
}

export function dueTomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return atMorning(date);
}

export function dueEndOfWeek(): Date {
  const date = new Date();
  const add = (5 - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + add);
  return atMorning(date);
}

export function dueInOneWeek(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return atMorning(date);
}

export function formatDueLabel(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'EEE d MMM');
}

export function isDueOverdue(value: Date | string): boolean {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}
