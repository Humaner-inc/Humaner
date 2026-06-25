import { z } from 'zod';

export const deleteAccountSchema = z.object({
  statement: z.coerce
    .boolean()
    .refine((value) => value === true, 'Confirmation is required.')
});

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
