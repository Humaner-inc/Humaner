import { type WebhookTrigger } from '@prisma/client';

export type WebhookDto = {
  id: string;
  url: string;
  triggers: WebhookTrigger[];
  secret?: string;
};
