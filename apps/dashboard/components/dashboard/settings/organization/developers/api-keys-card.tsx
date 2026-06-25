'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';

import { ApiKeyList } from '@/components/dashboard/settings/organization/developers/api-key-list';
import { CopyCreatedApiKeyModal } from '@/components/dashboard/settings/organization/developers/copy-created-api-key-modal';
import { CreateApiKeyModal } from '@/components/dashboard/settings/organization/developers/create-api-key-modal';
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
import type { ApiKeyDto } from '@/types/dtos/api-key-dto';

export type ApiKeysCardProps = CardProps & {
  apiKeys: ApiKeyDto[];
};

export function ApiKeysCard({
  apiKeys,
  className,
  ...other
}: ApiKeysCardProps): React.JSX.Element {
  const handleShowCreateApiKeyModal = async (): Promise<void> => {
    const apiKey: string = await NiceModal.show(CreateApiKeyModal);
    if (apiKey) {
      await NiceModal.show(CopyCreatedApiKeyModal, { apiKey });
    }
  };
  return (
    <Card
      className={cn('flex h-full flex-col', className)}
      {...other}
    >
      <CardContent className="max-h-72 flex-1 overflow-hidden p-0">
        {apiKeys.length > 0 ? (
          <ScrollArea className="h-full">
            <ApiKeyList apiKeys={apiKeys} />
          </ScrollArea>
        ) : (
          <EmptyText className="p-6">No API key found.</EmptyText>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full justify-end pt-6">
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={handleShowCreateApiKeyModal}
        >
          Create API key
        </Button>
      </CardFooter>
    </Card>
  );
}
