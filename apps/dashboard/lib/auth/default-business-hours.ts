import { DayOfWeek } from '@prisma/client';

import { createTimeSlot } from '@/lib/utils';

export function createDefaultBusinessHours() {
  return {
    create: [
      {
        dayOfWeek: DayOfWeek.SUNDAY
      },
      {
        dayOfWeek: DayOfWeek.MONDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.TUESDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.WEDNESDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.THURSDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.FRIDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.SATURDAY
      }
    ]
  };
}
