import { z } from 'zod';

export const replyMailThreadSchema = z.object({
  threadId: z.string().uuid(),
  aliasId: z.string().uuid().optional(),
  body: z.string().trim().min(1, 'Write a reply before sending').max(50_000)
});

export type ReplyMailThreadInput = z.infer<typeof replyMailThreadSchema>;
