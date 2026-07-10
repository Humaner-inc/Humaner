import { z } from 'zod';

export const addKnowledgeSourceSchema = z
  .object({
    agentId: z.string().uuid('A valid agent is required.'),
    type: z.enum(['URL', 'SITEMAP', 'TEXT', 'API']),
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
    content: z
      .string()
      .trim()
      .max(20000, 'Maximum 20000 characters allowed.')
      .optional()
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
  });

export type AddKnowledgeSourceSchema = z.infer<typeof addKnowledgeSourceSchema>;
