import { z } from 'zod';

export const updateOrganizationVerticalTopicsSchema = z.object({
  topics: z.array(z.string().trim().min(1).max(200)).max(40)
});

export type UpdateOrganizationVerticalTopicsSchema = z.infer<
  typeof updateOrganizationVerticalTopicsSchema
>;
