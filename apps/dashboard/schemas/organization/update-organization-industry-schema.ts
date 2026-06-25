import { IndustryType } from '@prisma/client';
import { z } from 'zod';

export const updateOrganizationIndustrySchema = z.object({
  industry: z.nativeEnum(IndustryType, {
    required_error: 'Please select an industry.',
    invalid_type_error: 'Please select a valid industry.'
  })
});

export type UpdateOrganizationIndustrySchema = z.infer<
  typeof updateOrganizationIndustrySchema
>;
