import { z } from 'zod';

import { passwordValidator } from '@/lib/auth/password';

export const resetPasswordSchema = z.object({
  requestId: z
    .string({
      required_error: 'Request is required.',
      invalid_type_error: 'Request id must be a string.'
    })
    .trim()
    .uuid('Request id is invalid.')
    .min(1, 'Request id is required.')
    .max(36, 'Maximum 36 characters allowed.'),
  password: z
    .string({
      required_error: 'Password is required.',
      invalid_type_error: 'Password must be a string.'
    })
    .min(1, 'Password is required.')
    .max(72, 'Maximum 72 characters allowed.')
    .refine((arg) => passwordValidator.validate(arg).success, {
      message: 'Password does not meet requirements.'
    })
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
