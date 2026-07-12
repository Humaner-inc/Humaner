import { z } from 'zod';

export const rescanKnowledgeSourceSchema = z.object({
  id: z.string().uuid()
});

export type RescanKnowledgeSourceSchema = z.infer<
  typeof rescanKnowledgeSourceSchema
>;
