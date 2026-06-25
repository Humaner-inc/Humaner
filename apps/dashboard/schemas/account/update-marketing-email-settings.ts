import { z } from 'zod';

export const updateMarketingEmailsSchema = z.object({
  enabledNewsletter: z.coerce.boolean(),
  enabledProductUpdates: z.coerce.boolean()
});

export type UpdateMarketingEmailsSchema = z.infer<
  typeof updateMarketingEmailsSchema
>;
