import { z } from 'zod';

export const getMostVisitedContactsSchema = z
  .object({
    from: z.coerce.date({
      required_error: 'From date is required.',
      invalid_type_error: 'From must be a valid date.'
    }),
    to: z.coerce.date({
      required_error: 'To date is required.',
      invalid_type_error: 'From must be a valid date.'
    })
  })
  .refine((data) => data.from <= data.to, {
    message: 'From date must be earlier than or equal to To date',
    path: ['from']
  });

export type GetMostVisitedContactsSchema = z.infer<
  typeof getMostVisitedContactsSchema
>;
