import { WebhookTrigger } from '@prisma/client';
import { literal, z } from 'zod';

export const updateWebhookSchema = z.object({
  id: z
    .string({
      required_error: 'Id is required.',
      invalid_type_error: 'Id must be a string.'
    })
    .trim()
    .uuid('Id is invalid.')
    .min(1, 'Id is required.')
    .max(36, 'Maximum 36 characters allowed.'),
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
    .string()
    .trim()
    .max(1024, 'Maximum 1024 characters allowed.')
    .optional()
    .or(literal(''))
});

export type UpdateWebhookSchema = z.infer<typeof updateWebhookSchema>;
