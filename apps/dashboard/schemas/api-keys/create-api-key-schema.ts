import { z } from 'zod';

export const createApiKeySchema = z.object({
  description: z
    .string({
      required_error: 'Description is required.',
      invalid_type_error: 'Description must be a string.'
    })
    .trim()
    .min(1, 'Description is required.')
    .max(70, `Maximum 70 characters allowed.`),
  expiresAt: z.coerce.date().optional(),
  neverExpires: z.coerce.boolean()
});

export type CreateApiKeySchema = z.infer<typeof createApiKeySchema>;
