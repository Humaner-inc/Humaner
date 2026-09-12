import { z } from 'zod';

export const createCalendarEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required.')
      .max(255, 'Maximum 255 characters allowed.'),
    description: z
      .string()
      .trim()
      .max(8000, 'Maximum 8000 characters allowed.')
      .optional()
      .transform((value) => value || undefined),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    attendeeIds: z.array(z.string().uuid()).max(50).default([]),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color.')
      .optional()
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'End time must be after start time.',
    path: ['endsAt']
  });

export type CreateCalendarEventSchema = z.infer<
  typeof createCalendarEventSchema
>;
