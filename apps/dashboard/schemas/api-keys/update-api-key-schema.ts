import { z } from 'zod';

export const updateApiKeySchema = z.object({
  id: z
    .string({
      required_error: 'Id is required.',
      invalid_type_error: 'Id must be a string.'
    })
    .trim()
    .uuid('Id is invalid.')
    .min(1, 'Id is required.')
    .max(36, 'Maximum 36 characters allowed.'),
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

export type UpdateApiKeySchema = z.infer<typeof updateApiKeySchema>;
