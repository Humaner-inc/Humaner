import { z } from 'zod';

export const updateModelTrainingConsentSchema = z.object({
  consent: z.boolean()
});

export type UpdateModelTrainingConsentSchema = z.infer<
  typeof updateModelTrainingConsentSchema
>;
