import { z } from 'zod';

import { composeDraftHasContent } from '@/lib/inbox/compose-draft';

export const saveMailDraftSchema = z
  .object({
    aliasId: z.string().uuid(),
    to: z.string().trim().max(255),
    subject: z.string().trim().max(998),
    body: z.string().trim().max(50_000),
    draftThreadId: z.string().uuid().optional()
  })
  .refine(composeDraftHasContent, {
    message: 'Write something before saving a draft'
  });

export type SaveMailDraftInput = z.infer<typeof saveMailDraftSchema>;
