import { z } from 'zod';

export const deleteAgentSchema = z.object({
  id: z.string().uuid('A valid agent is required.')
});

export type DeleteAgentSchema = z.infer<typeof deleteAgentSchema>;
