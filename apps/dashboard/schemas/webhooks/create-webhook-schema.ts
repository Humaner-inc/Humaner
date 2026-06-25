import { WebhookTrigger } from '@prisma/client';
import { literal, z } from 'zod';

export const createWebhookSchema = z.object({
  url: z
    .string({
      required_error: 'Webhook URL is required.',
      invalid_type_error: 'Webhook URL must be a string.'
    })
    .trim()
    .url('Enter a valid URL with schema.')
    .min(1, 'Webhook URL is required.')
    .max(2000, 'Maximum 2000 characters allowed.'),
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
