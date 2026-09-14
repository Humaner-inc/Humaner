import { z } from 'zod';

import { timeZoneSchema } from '@/schemas/account/time-zone-schema';

export const updatePreferencesSchema = z.object({
  locale: z
    .string({
      invalid_type_error: 'Locale must be a string.'
    })
    .trim()
    .max(8, 'Maximum 8 characters allowed.')
    .optional()
    .or(z.literal('')),
  timeZone: timeZoneSchema,
  theme: z.literal('light')
});

export type UpdatePreferencesSchema = z.infer<typeof updatePreferencesSchema>;
