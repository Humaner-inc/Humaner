import { type WebhookTrigger } from '@prisma/client';

export type WebhookDto = {
  id: string;
  url: string;
  triggers: WebhookTrigger[];
  /** Whether a signing secret is configured — never return plaintext. */
  hasSecret: boolean;
};
