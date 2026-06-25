import { z } from 'zod';

import { FileUploadAction } from '@/types/file-upload-action';

export const updateContactImageSchema = z.object({
  id: z
    .string({
      required_error: 'Id is required.',
      invalid_type_error: 'Id must be a string.'
    })
    .trim()
    .uuid('Id is invalid.')
    .min(1, 'Id is required.')
    .max(36, 'Maximum 36 characters allowed.'),
  action: z.nativeEnum(FileUploadAction, {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be a string'
  }),
  image: z
    .string({
      invalid_type_error: 'Image must be a string.'
    })
    .optional()
    .or(z.literal(''))
});

export type UpdateContactImageSchema = z.infer<typeof updateContactImageSchema>;
