import { z } from 'zod';

export const deleteOrganizationSchema = z.object({
  statement: z.coerce
    .boolean()
    .refine((value) => value === true, 'Confirmation is required.'),
  name: z
    .string({
      required_error: 'Workspace name is required.',
      invalid_type_error: 'Workspace name must be a string.'
    })
    .trim()
    .min(1, 'Type the workspace name to confirm.')
});

export type DeleteOrganizationSchema = z.infer<typeof deleteOrganizationSchema>;
