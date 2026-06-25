import { z } from 'zod';

export const addContactPageVisitSchema = z.object({
  contactId: z
    .string({
      required_error: 'Contact id is required.',
      invalid_type_error: 'Contact id must be a string.'
    })
    .trim()
    .uuid('Contact id is invalid.')
    .min(1, 'Contact id is required.')
    .max(36, 'Maximum 36 characters allowed.')
});

export type AddContactPageVisitSchema = z.infer<
  typeof addContactPageVisitSchema
>;
