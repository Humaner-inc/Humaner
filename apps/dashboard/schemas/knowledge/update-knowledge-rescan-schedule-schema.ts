import { z } from 'zod';

export const updateKnowledgeRescanScheduleSchema = z.object({
  agentId: z.string().uuid(),
  interval: z.enum(['NEVER', 'WEEKLY', 'MONTHLY'])
});

export type UpdateKnowledgeRescanScheduleSchema = z.infer<
  typeof updateKnowledgeRescanScheduleSchema
>;
