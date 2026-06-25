import * as React from 'react';

import { WebhooksCard } from '@/components/dashboard/settings/organization/developers/webhooks-card';
import { getWebhooks } from '@/data/webhooks/get-webhooks';

export default async function WebhooksPage(): Promise<React.JSX.Element> {
  const webhooks = await getWebhooks();
  return <WebhooksCard webhooks={webhooks} />;
}
