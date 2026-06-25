import { z } from 'zod';

export const submitRecoveryCodeSchema = z.object({
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
  recoveryCode: z
    .string({
      required_error: 'Recovery code is required.',
      invalid_type_error: 'Recovery code must be a string.'
    })
    .trim()
    .min(1, 'Recovery code is required.')
    .max(11, 'Maximum 11 characters allowed.')
});

export type SubmitRecoveryCodeSchema = z.infer<typeof submitRecoveryCodeSchema>;
