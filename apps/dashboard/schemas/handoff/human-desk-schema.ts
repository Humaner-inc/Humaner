import { z } from 'zod';

import { HandoffTicketStatus } from '@/types/handoff-ticket';

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
  status: z.nativeEnum(HandoffTicketStatus),
  resolutionPattern: z.string().trim().max(255).optional(),
  issueType: z.string().trim().max(128).optional(),
  resolutionSolution: z.string().trim().max(8000).optional(),
  feedCluster: z.boolean().optional(),
  sendSolutionEmail: z.boolean().optional()
});

export type UpdateHandoffTicketStatusSchema = z.infer<
  typeof updateHandoffTicketStatusSchema
>;

export const assignHandoffTicketSchema = z.object({
  id: z.string().uuid('A valid ticket is required.'),
  assigneeId: z.string().uuid('A valid teammate is required.').nullable()
});

export type AssignHandoffTicketSchema = z.infer<
  typeof assignHandoffTicketSchema
>;

export const updateLiveChatSettingsSchema = z.object({
  liveChatEnabled: z.boolean(),
  liveChatTimeoutMinutes: z
    .number()
    .int()
    .min(1, 'Minimum 1 minute.')
    .max(1440, 'Maximum 24 hours (1440 minutes).'),
  liveChatTimeoutMessage: z
    .string()
    .max(2000, 'Maximum 2000 characters.')
    .optional()
    .or(z.literal(''))
});

export type UpdateLiveChatSettingsSchema = z.infer<
  typeof updateLiveChatSettingsSchema
>;

export const setNoreplyEmailRepliesEnabledSchema = z.object({
  enabled: z.boolean()
});

export type SetNoreplyEmailRepliesEnabledSchema = z.infer<
  typeof setNoreplyEmailRepliesEnabledSchema
>;
