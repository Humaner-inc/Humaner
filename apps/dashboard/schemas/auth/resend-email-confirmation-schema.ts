import { z } from 'zod';

export const resendEmailConfirmationSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.'
    })
    .trim()
    .min(1, 'Email is required.')
    .max(255, 'Maximum 255 characters allowed.')
    .email('Enter a valid email address.')
});

export type ResendEmailConfirmationSchema = z.infer<
  typeof resendEmailConfirmationSchema
>;
