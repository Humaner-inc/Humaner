import { z } from 'zod';

export const toggleAgentPauseSchema = z.object({
  id: z.string().uuid('A valid agent is required.'),
  isPaused: z.boolean()
});

export type ToggleAgentPauseSchema = z.infer<typeof toggleAgentPauseSchema>;
