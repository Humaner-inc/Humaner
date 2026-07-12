import { z } from 'zod';

import {
  KNOWLEDGE_FILE_CONTENT_MAX_LENGTH,
  KNOWLEDGE_PASTED_TEXT_MAX_LENGTH
} from '@/lib/knowledge/content-limits';

export const addKnowledgeSourceSchema = z
  .object({
    agentId: z.string().uuid('A valid agent is required.'),
    type: z.enum(['URL', 'SITEMAP', 'TEXT', 'API']),
    contentFormat: z.enum(['text', 'markdown']).optional(),
    urls: z
      .array(z.string().trim().url('Enter valid URLs.').max(2048))
      .max(50, 'Add up to 50 URLs at a time.')
      .optional(),
    url: z.string().trim().url('Enter a valid URL.').max(2048).optional(),
    title: z
      .string()
      .trim()
      .max(255, 'Maximum 255 characters allowed.')
      .optional(),
    content: z.string().trim().optional()
  })
  .refine(
    (data) => data.type !== 'URL' || (data.urls && data.urls.length > 0),
    {
      message: 'Add at least one URL.',
      path: ['urls']
    }
  )
  .refine((data) => data.type !== 'SITEMAP' || !!data.url, {
    message: 'A root URL is required to crawl a site.',
    path: ['url']
  })
  .refine((data) => data.type !== 'API' || !!data.url, {
    message: 'An endpoint URL is required for API sources.',
    path: ['url']
  })
  .refine((data) => data.type !== 'TEXT' || (!!data.title && !!data.content), {
    message: 'A title and content are required for text sources.',
    path: ['content']
  })
  .superRefine((data, ctx) => {
    if (data.type !== 'TEXT' || !data.content) {
      return;
    }

    const maxLength =
      data.contentFormat === 'markdown'
        ? KNOWLEDGE_FILE_CONTENT_MAX_LENGTH
        : KNOWLEDGE_PASTED_TEXT_MAX_LENGTH;

    if (data.content.length > maxLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: maxLength,
        type: 'string',
        inclusive: true,
        message:
          data.contentFormat === 'markdown'
            ? `Each file must be under ${Math.round(maxLength / 1024)} KB.`
            : `Maximum ${maxLength.toLocaleString()} characters allowed.`,
        path: ['content']
      });
    }
  });

export type AddKnowledgeSourceSchema = z.infer<typeof addKnowledgeSourceSchema>;
