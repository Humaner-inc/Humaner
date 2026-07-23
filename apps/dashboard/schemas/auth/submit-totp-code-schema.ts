import { z } from 'zod';

export const submitTotpCodeSchema = z.object({
  token: z
    .string({
      invalid_type_error: 'Token must be a string.'
    })
    .trim()
    .min(1, 'Token is required.')
    .max(255, 'Maximum 255 characters allowed.'),
  expiry: z
    .string({
      invalid_type_error: 'Expiry must be a string.'
    })
    .trim()
    .min(1, 'Expiry is required.')
    .max(255, 'Maximum 255 characters allowed.'),
  totpCode: z
    .string({
      required_error: 'Code is required.',
      invalid_type_error: 'Code consists of 6 digits.'
    })
    .trim()
    .length(6, { message: 'Code must be 6 digits.' })
    .regex(/^\d{6}$/, { message: 'Code must be 6 digits.' })
});

export type SubmitTotpCodeSchema = z.infer<typeof submitTotpCodeSchema>;
