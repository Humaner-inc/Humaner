import type { DayOfWeek } from '@prisma/client';

export type WeeklyHoursSlot = {
  start: string;
  end: string;
};

export type WeeklyHoursDay = {
  dayOfWeek: DayOfWeek;
  slots: WeeklyHoursSlot[];
};

export type WeeklyHoursJson = {
  days: WeeklyHoursDay[];
};
