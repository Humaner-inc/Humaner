import { Role, WebhookTrigger } from '@prisma/client';

export const roleLabels: Record<Role, string> = {
  [Role.MEMBER]: 'Member',
  [Role.ADMIN]: 'Admin'
};

export const webhookTriggerLabels: Record<WebhookTrigger, string> = {
  [WebhookTrigger.CONTACT_CREATED]: 'Contact created',
  [WebhookTrigger.CONTACT_UPDATED]: 'Contact updated',
  [WebhookTrigger.CONTACT_DELETED]: 'Contact deleted'
};
