import { z } from 'zod';

import { FileUploadAction } from '@/types/file-upload-action';

export const updatePersonalDetailsSchema = z.object({
  action: z.nativeEnum(FileUploadAction, {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be a string'
  }),
  image: z
    .string({
      invalid_type_error: 'Image must be a string.'
    })
    .optional()
    .or(z.literal('')),
  name: z
    .string({
      required_error: 'Name is required.',
      invalid_type_error: 'Name must be a string.'
    })
    .trim()
    .min(1, 'Name is required.')
    .max(64, 'Maximum 64 characters allowed.'),
  phone: z
    .string({
      invalid_type_error: 'Phone must be a string.'
    })
    .trim()
    .max(16, 'Maximum 16 characters allowed.')
    .optional()
    .or(z.literal(''))
});

export type UpdatePersonalDetailsSchema = z.infer<
  typeof updatePersonalDetailsSchema
>;
