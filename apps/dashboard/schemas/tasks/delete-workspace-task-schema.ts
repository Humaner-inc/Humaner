import { z } from 'zod';

export const deleteWorkspaceTaskSchema = z.object({
  id: z.string().uuid('A valid task is required.')
});

export type DeleteWorkspaceTaskSchema = z.infer<
  typeof deleteWorkspaceTaskSchema
>;
