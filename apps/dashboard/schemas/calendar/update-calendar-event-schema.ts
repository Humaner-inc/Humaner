import { z } from 'zod';

export const updateCalendarEventSchema = z
  .object({
    id: z.string().uuid(),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required.')
      .max(255, 'Maximum 255 characters allowed.')
      .optional(),
    description: z
      .string()
      .trim()
      .max(8000, 'Maximum 8000 characters allowed.')
      .optional()
      .nullable(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    attendeeIds: z.array(z.string().uuid()).max(50).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color.')
      .optional()
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return data.endsAt > data.startsAt;
      }
      return true;
    },
    {
      message: 'End time must be after start time.',
      path: ['endsAt']
    }
  );

export type UpdateCalendarEventSchema = z.infer<
  typeof updateCalendarEventSchema
>;
