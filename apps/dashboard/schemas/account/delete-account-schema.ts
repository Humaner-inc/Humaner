import { z } from 'zod';

export const deleteAccountSchema = z.object({
  statement: z.coerce
    .boolean()
    .refine((value) => value === true, 'Confirmation is required.'),
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.'
    })
    .trim()
    .min(1, 'Type your account email to confirm.')
    .email('Enter a valid email address.')
});

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
