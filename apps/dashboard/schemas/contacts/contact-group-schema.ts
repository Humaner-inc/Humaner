import { z } from 'zod';

export const createContactGroupSchema = z.object({
  name: z.string().trim().min(1).max(128),
  color: z
    .enum(['sky', 'violet', 'amber', 'teal', 'rose', 'lime'])
    .optional()
    .default('sky'),
  /** Seed members from CSV / markdown import (matched or created). */
  members: z
    .array(
      z.object({
        email: z.string().email().max(255),
        name: z.string().trim().max(128).optional()
      })
    )
    .max(500)
    .optional()
});

export const contactGroupIdSchema = z.object({
  groupId: z.string().uuid()
});

export const updateContactGroupSchema = z.object({
  groupId: z.string().uuid(),
  color: z.enum(['sky', 'violet', 'amber', 'teal', 'rose', 'lime']).optional(),
  name: z.string().trim().min(1).max(128).optional()
});

export const addContactToGroupSchema = z.object({
  groupId: z.string().uuid(),
  contactId: z.string().uuid()
});

export const removeContactFromGroupSchema = z.object({
  groupId: z.string().uuid(),
  contactId: z.string().uuid()
});
