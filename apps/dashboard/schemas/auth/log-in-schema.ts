import { z } from 'zod';

export const logInSchema = z.object({
  email: z
    .string({
      invalid_type_error: 'Email must be a string.'
    })
    .trim()
    .min(1, 'Email is required.')
    .max(255, 'Maximum 255 characters allowed.')
    .email('Enter a valid email address.'),
  password: z
    .string({
      required_error: 'Password is required.',
      invalid_type_error: 'Password must be a string.'
    })
    .min(1, 'Password is required.')
    .max(72, 'Maximum 72 characters allowed.')
});

export const passThroughlogInSchema = z.object({
  email: z
    .string({
      invalid_type_error: 'Email must be a string.'
    })
    .trim()
    .max(255, 'Maximum 255 characters allowed.'),
  password: z
    .string({
      invalid_type_error: 'Password must be a string.'
    })
    .max(72, 'Maximum 72 characters allowed.')
});

export type LogInSchema = z.infer<typeof logInSchema>;
export type PassThroughLogInSchema = z.infer<typeof passThroughlogInSchema>;
