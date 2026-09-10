import { z } from 'zod';

import { HandoffTicketUrgency } from '@/types/handoff-ticket';

export const createWorkspaceTaskSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, 'Add a task title.')
    .max(255, 'Maximum 255 characters allowed.'),
  summary: z
    .string()
    .trim()
    .max(4000, 'Maximum 4000 characters allowed.')
    .optional()
    .or(z.literal('')),
  assigneeId: z.string().uuid('A valid teammate is required.').nullable(),
  urgency: z.nativeEnum(HandoffTicketUrgency).optional()
});

export type CreateWorkspaceTaskSchema = z.infer<
  typeof createWorkspaceTaskSchema
>;
