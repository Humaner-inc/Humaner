'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { PlusIcon } from '@humaner/shared/icons';

import { CreateWebhookModal } from '@/components/dashboard/settings/organization/developers/create-webhook-modal';
import { WebhookList } from '@/components/dashboard/settings/organization/developers/webhook-list';
import { Button } from '@/components/ui/button';
import { EmptyText } from '@/components/ui/empty-text';
import type { WebhookDto } from '@/types/dtos/webhook-dto';

export type WebhooksCardProps = {
  webhooks: WebhookDto[];
};

export function WebhooksCard({
  webhooks
}: WebhooksCardProps): React.JSX.Element {
  const router = useRouter();

  const handleShowCreateWebhookModal = async (): Promise<void> => {
    await NiceModal.show(CreateWebhookModal);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {webhooks.length > 0 ? (
        <WebhookList webhooks={webhooks} />
      ) : (
        <EmptyText className="p-0 text-sm">No webhooks yet.</EmptyText>
      )}
      <div className="flex justify-end pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleShowCreateWebhookModal}
        >
          <PlusIcon className="size-3.5" />
          Create webhook
        </Button>
      </div>
    </div>
  );
}
