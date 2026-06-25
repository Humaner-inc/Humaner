import { z } from 'zod';

export const updateOrganizationDetailsSchema = z.object({
  name: z
    .string({
      required_error: 'Organization name is required.',
      invalid_type_error: 'Name must be a string.'
    })
    .trim()
    .min(1, 'Organization name is required.')
    .max(255, 'Maximum 255 characters allowed.'),
  address: z
    .string({
      invalid_type_error: 'Address must be a string.'
    })
    .trim()
    .max(255, 'Maximum 255 characters allowed.')
    .optional()
    .or(z.literal('')),
  phone: z
    .string({
      invalid_type_error: 'Phone must be a string.'
    })
    .trim()
    .max(16, 'Maximum 16 characters allowed.')
    .optional()
    .or(z.literal('')),
  email: z
    .string({
      invalid_type_error: 'Email must be a string.'
    })
    .trim()
    .max(255, 'Maximum 255 characters allowed.')
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
  website: z
    .string({
      invalid_type_error: 'Website URL must be a string.'
    })
    .trim()
    .url('Enter a valid URL with schema.')
    .max(2000, 'Maximum 2000 characters allowed.')
    .optional()
    .or(z.literal(''))
});

export type UpdateOrganizationDetailsSchema = z.infer<
  typeof updateOrganizationDetailsSchema
>;
