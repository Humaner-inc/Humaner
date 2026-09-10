import { z } from 'zod';

export const deleteCalendarEventSchema = z.object({
  id: z.string().uuid()
});

export type DeleteCalendarEventSchema = z.infer<
  typeof deleteCalendarEventSchema
>;
