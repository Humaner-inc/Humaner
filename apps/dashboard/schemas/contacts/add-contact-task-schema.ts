import { ContactTaskStatus } from '@prisma/client';
import { z } from 'zod';

export const addContactTaskSchema = z.object({
  contactId: z
    .string({
      invalid_type_error: 'Contact id must be a string.'
    })
    .trim()
    .uuid('Contact id is invalid.')
    .max(36, 'Maximum 36 characters allowed.'),
  title: z
    .string({
      required_error: 'Title is required.',
      invalid_type_error: 'Title must be a string.'
    })
    .trim()
    .min(1, 'Title is required.')
    .max(64, `Maximum 64 characters allowed.`),
  description: z
    .string({
      invalid_type_error: 'Description must be a string.'
    })
    .trim()
    .max(4000, `Maximum 4000 characters allowed.`)
    .optional()
    .or(z.literal('')),
  dueDate: z.coerce.date().optional(),
  status: z.nativeEnum(ContactTaskStatus, {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be a string'
  })
});

export type AddContactTaskSchema = z.infer<typeof addContactTaskSchema>;
