import { z } from 'zod';

const deskUrgencySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const updateActivityNotificationsSchema = z.object({
  desk: z.object({
    inApp: z.coerce.boolean(),
    email: z.coerce.boolean(),
    urgencies: z.array(deskUrgencySchema)
  }),
  mail: z.object({
    inApp: z.coerce.boolean(),
    email: z.coerce.boolean(),
    tagIds: z.array(z.string().uuid())
  })
});

export type UpdateActivityNotificationsSchema = z.infer<
  typeof updateActivityNotificationsSchema
>;
