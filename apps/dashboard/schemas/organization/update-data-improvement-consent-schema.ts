import { z } from 'zod';

export const updateDataImprovementConsentSchema = z.object({
  consent: z.boolean()
});

export type UpdateDataImprovementConsentSchema = z.infer<
  typeof updateDataImprovementConsentSchema
>;
