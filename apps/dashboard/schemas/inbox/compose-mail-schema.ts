import { z } from 'zod';

import { mailAttachmentListSchema } from '@/lib/inbox/mail-attachments';

const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address')
  .max(255);

export const composeMailSchema = z.object({
  aliasId: z.string().uuid(),
  to: emailSchema,
  subject: z
    .string()
    .trim()
    .min(1, 'Add a subject')
    .max(998, 'Subject is too long'),
  body: z.string().trim().min(1, 'Write a message before sending').max(50_000),
  bodyHtml: z.string().trim().max(100_000).optional(),
  attachments: mailAttachmentListSchema.optional(),
  draftThreadId: z.string().uuid().optional()
});

export type ComposeMailInput = z.infer<typeof composeMailSchema>;
