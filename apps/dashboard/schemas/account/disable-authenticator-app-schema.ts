import { z } from 'zod';

export const disableAuthenticatorAppSchema = z.object({
  totpCode: z
    .string({
      required_error: 'Code is required.',
      invalid_type_error: 'Code consists of 6 digits.'
    })
    .trim()
    .min(6, { message: '' })
    .max(6, { message: 'Code consists of 6 digits.' })
});

export type DisableAuthenticatorAppSchema = z.infer<
  typeof disableAuthenticatorAppSchema
>;
