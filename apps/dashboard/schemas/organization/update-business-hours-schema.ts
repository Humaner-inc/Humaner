import { DayOfWeek } from '@prisma/client';
import {
  compareAsc,
  format,
  isAfter,
  isSameSecond,
  parse,
  parseISO,
  setHours,
  setMinutes
} from 'date-fns';
import { z } from 'zod';

import { WorkHoursDto } from '@/types/dtos/work-hours-dto';
import { WorkTimeSlotDto } from '@/types/dtos/work-time-slot-dto';

export const updateBusinessHoursSchema = z.object({
  businessHours: z
    .array(
      z.object({
        dayOfWeek: z.nativeEnum(DayOfWeek),
        timeSlots: z.array(
          z.object({
            id: z
              .string({
                required_error: 'Id is required.',
                invalid_type_error: 'Id must be a string.'
              })
              .trim()
              .uuid('Id is invalid.')
              .min(1, 'Id is required.')
              .max(36, 'Maximum 36 characters allowed.'),
            start: z
              .string()
              .datetime()
              .transform((iso) => {
                const date = parse(
                  iso,
                  "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
                  new Date()
                );
                const baseDate = new Date(0);
                const newDate = setMinutes(
                  setHours(baseDate, date.getUTCHours()),
                  date.getUTCMinutes()
                );
                return format(newDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
              }),
            end: z
              .string()
              .datetime()
              .transform((iso) => {
                const date = parse(
                  iso,
                  "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
                  new Date()
                );
                const baseDate = new Date(0);
                const newDate = setMinutes(
                  setHours(baseDate, date.getUTCHours()),
                  date.getUTCMinutes()
                );
                return format(newDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
              })
          })
        )
      })
    )
    .refine((workHours) => areWorkHoursValid(workHours))
});

export type UpdateBusinessHoursSchema = z.infer<
  typeof updateBusinessHoursSchema
>;

export function isEndGreaterThanStart(timeSlot: WorkTimeSlotDto): boolean {
  const normalized = normalizedTimeSlot(timeSlot);
  return isAfter(parseISO(normalized.end), parseISO(normalized.start));
}

export function isEveryEndGreaterThanStart(workHours: WorkHoursDto[]): boolean {
  for (const w of workHours) {
    if (w.timeSlots && w.timeSlots.length > 0) {
      for (const timeSlot of w.timeSlots) {
        if (!isEndGreaterThanStart(timeSlot)) {
          return false;
        }
      }
    }
  }
  return true;
}

export type Interval = {
  start: Date;
  end: Date;
};

type Options = {
  inclusive?: boolean;
};

export function areIntervalsOverlapping(
  interval1: Interval,
  interval2: Interval,
  options: Options = {}
): boolean {
  const { start: start1, end: end1 } = interval1;
  const { start: start2, end: end2 } = interval2;

  if (options.inclusive) {
    return !(isAfter(start1, end2) || isAfter(start2, end1));
  } else {
    return !(
      isSameSecond(start1, end2) ||
      isSameSecond(start2, end1) ||
      isAfter(start1, end2) ||
      isAfter(start2, end1)
    );
  }
}

export function getOverlappingTimeSlotsIds(
  timeSlots?: WorkTimeSlotDto[]
): string[] {
  if (!timeSlots || timeSlots.length < 2) {
    return [];
  }
  const overlappingTimeSlots: string[] = [];
  const normalizedTimeSlots = normalizeTimeSlots(timeSlots);
  const orderedTimeSlots = orderTimeSlotsByStart(normalizedTimeSlots);
  for (let i = 1; i < orderedTimeSlots.length; i++) {
    const prev = orderedTimeSlots[i - 1];
    const current = orderedTimeSlots[i];
    const overlapping = areIntervalsOverlapping(
      { start: parseISO(prev.start), end: parseISO(prev.end) },
      { start: parseISO(current.start), end: parseISO(current.end) },
      {
        inclusive: false
      }
    );
    if (overlapping) {
      overlappingTimeSlots.push(prev.id);
      overlappingTimeSlots.push(current.id);
    }
  }
  return [...new Set(overlappingTimeSlots)];
}

export function areThereNoOverlaps(workHours: WorkHoursDto[]): boolean {
  for (const w of workHours) {
    if (w.timeSlots && w.timeSlots.length > 1) {
      const normalizedTimeSlots = normalizeTimeSlots(w.timeSlots);
      const orderedTimeSlots = orderTimeSlotsByStart(normalizedTimeSlots);
      for (let j = 1; j < orderedTimeSlots.length; j++) {
        const prev = orderedTimeSlots[j - 1];
        const current = orderedTimeSlots[j];
        const overlapping = areIntervalsOverlapping(
          { start: parseISO(prev.start), end: parseISO(prev.end) },
          { start: parseISO(current.start), end: parseISO(current.end) },
          {
            inclusive: false
          }
        );
        if (overlapping) {
          return false;
        }
      }
    }
  }
  return true;
}

export function noDuplicateDayOfWeek(workHours: WorkHoursDto[]): boolean {
  const seen = new Set<DayOfWeek>();
  for (const w of workHours) {
    const key = w.dayOfWeek.toUpperCase() as DayOfWeek;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }

  return seen.size === 7;
}

export function areWorkHoursValid(workHours: WorkHoursDto[]): boolean {
  return (
    noDuplicateDayOfWeek(workHours) &&
    isEveryEndGreaterThanStart(workHours) &&
    areThereNoOverlaps(workHours)
  );
}

function normalizedTimeSlot(timeSlot: WorkTimeSlotDto): WorkTimeSlotDto {
  const start = parseISO(timeSlot.start);
  const end = parseISO(timeSlot.end);
  const baseDate = new Date(Date.UTC(1970, 0, 1));
  return {
    id: timeSlot.id,
    start: setMinutes(
      setHours(baseDate, start.getUTCHours()),
      start.getUTCMinutes()
    ).toISOString(),
    end: setMinutes(
      setHours(baseDate, end.getUTCHours()),
      end.getUTCMinutes()
    ).toISOString()
  };
}

function normalizeTimeSlots(timeSlots: WorkTimeSlotDto[]): WorkTimeSlotDto[] {
  return timeSlots.map((timeSlot) => normalizedTimeSlot(timeSlot));
}

function orderTimeSlotsByStart(
  timeSlots: WorkTimeSlotDto[]
): WorkTimeSlotDto[] {
  return timeSlots.sort((a, b) =>
    compareAsc(parseISO(a.start), parseISO(b.start))
  );
}
