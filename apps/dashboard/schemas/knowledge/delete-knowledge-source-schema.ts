import { z } from 'zod';

export const deleteKnowledgeSourceSchema = z.object({
  id: z.string().uuid()
});

export type DeleteKnowledgeSourceSchema = z.infer<
  typeof deleteKnowledgeSourceSchema
>;
