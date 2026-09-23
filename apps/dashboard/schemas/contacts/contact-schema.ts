import { z } from 'zod';

const emailField = z
  .string()
  .trim()
  .min(3)
  .max(255)
  .email('Enter a valid email address.');

export const addContactSchema = z.object({
  email: emailField,
  name: z.string().trim().max(128).optional(),
  company: z.string().trim().max(128).optional(),
  notes: z.string().trim().max(4000).optional()
});

export const updateContactSchema = z.object({
  contactId: z.string().uuid(),
  name: z.string().trim().min(1).max(128),
  company: z.string().trim().max(128).optional(),
  notes: z.string().trim().max(4000).optional()
});

export const contactIdSchema = z.object({
  contactId: z.string().uuid()
});
