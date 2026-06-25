import { z } from 'zod';

export const addContactCommentSchema = z.object({
  contactId: z
    .string({
      required_error: 'Contact id is required.',
      invalid_type_error: 'Contact id must be a string.'
    })
    .trim()
    .uuid('Contact id is invalid.')
    .min(1, 'Contact id is required.')
    .max(36, 'Maximum 36 characters allowed.'),
  text: z
    .string({
      required_error: 'Text is required.',
      invalid_type_error: 'Text must be a string.'
    })
    .trim()
    .min(1, 'Text is required.')
    .max(2000, 'Maximum 2000 characters allowed.')
});

export type AddContactCommentSchema = z.infer<typeof addContactCommentSchema>;
