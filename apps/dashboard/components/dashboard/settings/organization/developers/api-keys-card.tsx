'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { PlusIcon } from '@humaner/shared/icons';

import { ApiKeyList } from '@/components/dashboard/settings/organization/developers/api-key-list';
import { CreateApiKeyModal } from '@/components/dashboard/settings/organization/developers/create-api-key-modal';
import { Button } from '@/components/ui/button';
import { EmptyText } from '@/components/ui/empty-text';
import type { ApiKeyDto } from '@/types/dtos/api-key-dto';

export type ApiKeysCardProps = {
  apiKeys: ApiKeyDto[];
};

export function ApiKeysCard({ apiKeys }: ApiKeysCardProps): React.JSX.Element {
  const router = useRouter();

  const handleShowCreateApiKeyModal = async (): Promise<void> => {
    const apiKey: string = await NiceModal.show(CreateApiKeyModal);
    if (apiKey) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-3">
      {apiKeys.length > 0 ? (
        <ApiKeyList apiKeys={apiKeys} />
      ) : (
        <EmptyText className="p-0 text-sm">No keys yet.</EmptyText>
      )}
      <div className="flex justify-end pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleShowCreateApiKeyModal}
        >
          <PlusIcon className="size-3.5" />
          Create key
        </Button>
      </div>
    </div>
  );
}
