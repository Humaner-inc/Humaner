'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';

import { CreateWebhookModal } from '@/components/dashboard/settings/organization/developers/create-webhook-modal';
import { WebhookList } from '@/components/dashboard/settings/organization/developers/webhook-list';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import { EmptyText } from '@/components/ui/empty-text';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { WebhookDto } from '@/types/dtos/webhook-dto';

export type WebhooksCardProps = CardProps & {
  webhooks: WebhookDto[];
};

export function WebhooksCard({
  webhooks,
  className,
  ...other
}: WebhooksCardProps): React.JSX.Element {
  const handleShowCreateWebhookModal = (): void => {
    NiceModal.show(CreateWebhookModal);
  };
  return (
    <Card
      className={cn('flex h-full flex-col', className)}
      {...other}
    >
      <CardContent className="max-h-72 flex-1 overflow-hidden p-0">
        {webhooks.length > 0 ? (
          <ScrollArea className="h-full">
            <WebhookList webhooks={webhooks} />
          </ScrollArea>
        ) : (
          <EmptyText className="p-6">No webhook found.</EmptyText>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full justify-end pt-6">
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={handleShowCreateWebhookModal}
        >
          Create webhook
        </Button>
      </CardFooter>
    </Card>
  );
}
