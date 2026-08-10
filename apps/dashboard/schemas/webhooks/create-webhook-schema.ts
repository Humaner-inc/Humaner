import { WebhookTrigger } from '@prisma/client';
import { literal, z } from 'zod';

import { isPublicHttpUrl } from '@/lib/urls/is-public-http-url';

export const createWebhookSchema = z.object({
  url: z
    .string({
      required_error: 'Webhook URL is required.',
      invalid_type_error: 'Webhook URL must be a string.'
    })
    .trim()
    .url('Enter a valid URL with schema.')
    .min(1, 'Webhook URL is required.')
    .max(2000, 'Maximum 2000 characters allowed.')
    .refine((value) => {
      try {
        const url = new URL(value);
        if (
          process.env.NODE_ENV === 'production' &&
          url.protocol !== 'https:'
        ) {
          return false;
        }
        return isPublicHttpUrl(url);
      } catch {
        return false;
      }
    }, 'Webhook URL must be a public HTTPS endpoint.'),
  triggers: z.array(
    z.nativeEnum(WebhookTrigger, {
      required_error: 'Trigger is required',
      invalid_type_error: 'Trigger must be a string'
    })
  ),
  secret: z
    .string({
      invalid_type_error: 'Secret must be a string.'
    })
    .trim()
    .max(1024, 'Maximum 1024 characters allowed.')
    .optional()
    .or(literal(''))
});

export type CreateWebhookSchema = z.infer<typeof createWebhookSchema>;
