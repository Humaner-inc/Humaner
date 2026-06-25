import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { AppInfo } from '@/constants/app-info';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mergeRefs<T>(
  ...refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

export function createTitle(title: string, addSuffix: boolean = true): string {
  if (!addSuffix) {
    return title;
  }
  if (!title) {
    return AppInfo.APP_NAME;
  }

  return `${title} | ${AppInfo.APP_NAME}`;
}

export function capitalize(str: string): string {
  if (!str) {
    return str;
  }

  if (str.length === 1) {
    return str.charAt(0).toUpperCase();
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(name: string): string {
  if (!name) {
    return '';
  }
  return name
    .replace(/\s+/, ' ')
    .split(' ')
    .slice(0, 2)
    .map((v) => v && v[0].toUpperCase())
    .join('');
}

export function createTimeSlot(hours: number, minutes: number): Date {
  const date = new Date(0);

  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setMinutes(0);
  date.setHours(0);

  date.setHours(hours);
  date.setMinutes(minutes);

  return date;
}

export function splitIntoChunks(
  str: string,
  sep: string,
  chunkSize: number
): string {
  return str.match(new RegExp(`.{1,${chunkSize}}`, 'g'))?.join(sep) || '';
}
