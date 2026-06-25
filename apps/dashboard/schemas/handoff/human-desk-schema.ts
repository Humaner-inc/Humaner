import { HandoffTicketStatus } from '@/types/handoff-ticket';
import { z } from 'zod';

export const setHumanDeskEnabledSchema = z.object({
  enabled: z.boolean()
});

export type SetHumanDeskEnabledSchema = z.infer<
  typeof setHumanDeskEnabledSchema
>;

export const setSupportEmailSchema = z.object({
  // Empty string clears the dedicated support email; otherwise must be valid.
  supportEmail: z
    .string()
    .trim()
    .max(255, 'Maximum 255 characters allowed.')
    .refine(
      (value) => value === '' || z.string().email().safeParse(value).success,
      'Enter a valid email address.'
    )
});

export type SetSupportEmailSchema = z.infer<typeof setSupportEmailSchema>;

export const updateHandoffTicketStatusSchema = z.object({
  id: z.string().uuid('A valid ticket is required.'),
  status: z.nativeEnum(HandoffTicketStatus)
});

export type UpdateHandoffTicketStatusSchema = z.infer<
  typeof updateHandoffTicketStatusSchema
>;
