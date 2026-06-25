import { z } from 'zod';

export const changeEmailSchema = z.object({
  id: z
    .string({
      required_error: 'Id is required.',
      invalid_type_error: 'Id must be a string.'
    })
    .trim()
    .min(1, 'Id is required.')
    .max(255, 'Maximum 255 characters allowed.')
});

export type ChangeEmailSchema = z.infer<typeof changeEmailSchema>;
