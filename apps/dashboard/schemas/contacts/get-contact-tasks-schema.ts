import { z } from 'zod';

export const getContactTasksSchema = z.object({
  contactId: z
    .string({
      invalid_type_error: 'Contact id must be a string.'
    })
    .trim()
    .uuid('Contact id is invalid.')
    .max(36, 'Maximum 36 characters allowed.')
});

export type GetContactTasksSchema = z.infer<typeof getContactTasksSchema>;
