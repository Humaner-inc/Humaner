import { type DayOfWeek } from '@prisma/client';

import type { WorkTimeSlotDto } from '@/types/dtos/work-time-slot-dto';

export type WorkHoursDto = {
  dayOfWeek: DayOfWeek;
  timeSlots?: WorkTimeSlotDto[];
};
