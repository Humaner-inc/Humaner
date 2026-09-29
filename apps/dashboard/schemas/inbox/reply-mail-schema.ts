import { z } from 'zod';

import { mailAttachmentListSchema } from '@/lib/inbox/mail-attachments';

export const replyMailThreadSchema = z.object({
  threadId: z.string().uuid(),
  aliasId: z.string().uuid().optional(),
  body: z.string().trim().min(1, 'Write a reply before sending').max(50_000),
  bodyHtml: z.string().trim().max(100_000).optional(),
  attachments: mailAttachmentListSchema.optional()
});

export type ReplyMailThreadInput = z.infer<typeof replyMailThreadSchema>;
