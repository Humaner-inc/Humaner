import { z } from 'zod';

const apiKeyScopeEnum = z.enum(['intelligence', 'helpdesk']);

export const createApiKeySchema = z
  .object({
    description: z
      .string({
        required_error: 'Description is required.',
        invalid_type_error: 'Description must be a string.'
      })
      .trim()
      .min(1, 'Description is required.')
      .max(70, `Maximum 70 characters allowed.`),
    expiresAt: z.coerce.date().optional(),
    neverExpires: z.coerce.boolean(),
    access: z.enum(['full', 'scoped']),
    scopes: z.array(apiKeyScopeEnum)
  })
  .superRefine((data, ctx) => {
    if (data.access === 'scoped' && data.scopes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scopes'],
        message: 'Pick at least one permission.'
      });
    }
  });

export type CreateApiKeySchema = z.infer<typeof createApiKeySchema>;
