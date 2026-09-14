import { z } from 'zod';

import { resolveIanaTimeZone } from '@/lib/calendar/parse-calendar-when';

export const timeZoneSchema = z
  .string()
  .trim()
  .max(64)
  .nullable()
  .transform((value, ctx) => {
    if (!value) {
      return null;
    }
    const resolved = resolveIanaTimeZone(value);
    if (!resolved) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid timezone.'
      });
      return z.NEVER;
    }
    return resolved;
  });

export const updateMemberTimeZoneSchema = z.object({
  userId: z.string().uuid(),
  timeZone: timeZoneSchema
});

export type UpdateMemberTimeZoneSchema = z.infer<
  typeof updateMemberTimeZoneSchema
>;
