import { z } from 'zod';

export const updateTransactionalEmailsSchema = z.object({
  enabledContactsNotifications: z.coerce.boolean(),
  enabledInboxNotifications: z.coerce.boolean(),
  enabledWeeklySummary: z.coerce.boolean()
});

export type UpdateTransactionalEmailsSchema = z.infer<
  typeof updateTransactionalEmailsSchema
>;
