import { z } from 'zod';

export const enableAuthenticatorAppSchema = z.object({
  accountName: z
    .string({
      required_error: 'Account name is required.',
      invalid_type_error: 'Account name must be a string.'
    })
    .trim()
    .min(1, 'Account name is required.')
    .max(255, `Maximum 255 characters allowed.`),
  issuer: z
    .string({
      required_error: 'Issuer is required.',
      invalid_type_error: 'Issuer must be a string.'
    })
    .trim()
    .min(1, 'Issuer is required.')
    .max(255, `Maximum 255 characters allowed.`),
  secret: z
    .string({
      required_error: 'Secret is required.',
      invalid_type_error: 'Secret must be a string.'
    })
    .trim()
    .min(1, 'Secret is required.')
    .max(32, `Maximum 32 characters allowed.`),
  totpCode: z
    .string({
      required_error: 'Code is required.',
      invalid_type_error: 'Code consists of 6 digits.'
    })
    .trim()
    .min(6, { message: '' })
});

export type EnableAuthenticatorAppSchema = z.infer<
  typeof enableAuthenticatorAppSchema
>;
