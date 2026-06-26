import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  website: z
    .string({
      required_error: 'Business URL is required.',
      invalid_type_error: 'Business URL must be a string.'
    })
    .trim()
    .min(1, 'Business URL is required.')
    .max(2000, 'Maximum 2000 characters allowed.')
    .url('Please enter a valid URL (https://example.com).')
});

export type CreateWorkspaceSchema = z.infer<typeof createWorkspaceSchema>;

export const switchWorkspaceSchema = z.object({
  organizationId: z.string().uuid('Invalid workspace id.')
});

export type SwitchWorkspaceSchema = z.infer<typeof switchWorkspaceSchema>;
