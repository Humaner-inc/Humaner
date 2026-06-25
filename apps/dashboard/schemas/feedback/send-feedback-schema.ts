import { FeedbackCategory } from '@prisma/client';
import { z } from 'zod';

export const sendFeedbackSchema = z.object({
  category: z.nativeEnum(FeedbackCategory, {
    required_error: 'Category is required',
    invalid_type_error: 'Cateogry must be a string'
  }),
  message: z
    .string({
      required_error: 'Message is required.',
      invalid_type_error: 'Message must be a string.'
    })
    .trim()
    .min(1, 'Message is required.')
    .max(4000, `Maximum 4000 characters allowed.`)
});

export type SendFeedbackSchema = z.infer<typeof sendFeedbackSchema>;
