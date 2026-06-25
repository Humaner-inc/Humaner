import { z } from 'zod';

export const logOutSchema = z.object({
  redirect: z.coerce.boolean()
});

export type LogOutSchema = z.infer<typeof logOutSchema>;
