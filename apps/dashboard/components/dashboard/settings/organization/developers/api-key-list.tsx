'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { format } from 'date-fns';
import { MoreHorizontalIcon } from 'lucide-react';

import { EditApiKeyModal } from '@/components/dashboard/settings/organization/developers/edit-api-key-modal';
import { RevokeApiKeyModal } from '@/components/dashboard/settings/organization/developers/revoke-api-key-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ApiKeyDto } from '@/types/dtos/api-key-dto';

export type ApiKeyListProps = React.HtmlHTMLAttributes<HTMLUListElement> & {
  apiKeys: ApiKeyDto[];
};

export function ApiKeyList({
  apiKeys,
  className,
  ...other
}: ApiKeyListProps): React.JSX.Element {
  return (
    <ul
      role="list"
      className={cn('m-0 list-none divide-y p-0', className)}
      {...other}
    >
      {apiKeys.map((apiKey) => (
        <ApiKeyListItem
          key={apiKey.id}
          apiKey={apiKey}
        />
      ))}
    </ul>
  );
}

type ApiKeyListItemProps = React.HtmlHTMLAttributes<HTMLLIElement> & {
  apiKey: ApiKeyDto;
};

function ApiKeyListItem({
  apiKey,
  className,
  ...other
}: ApiKeyListItemProps): React.JSX.Element {
  const handleShowUpdateApiKeyModal = (): void => {
    NiceModal.show(EditApiKeyModal, { apiKey });
  };
  const handleShowRevokeApiKeyModal = (): void => {
    NiceModal.show(RevokeApiKeyModal, { apiKey });
  };
  return (
    <li
      role="listitem"
      className={cn(
        'flex w-full min-w-0 flex-row justify-between p-6',
        className
      )}
      {...other}
    >
      <div className="flex flex-col overflow-hidden truncate">
        <div className="text-sm font-medium">{apiKey.description}</div>
        <div
          suppressHydrationWarning
          className="text-xs font-normal text-muted-foreground"
        >
          {apiKey.expiresAt
            ? `Expires on ${format(apiKey.expiresAt, 'dd MMM yyyy')}`
            : 'Never expires'}
        </div>
      </div>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="size-8 p-0"
            title="Open menu"
          >
            <MoreHorizontalIcon className="size-4 shrink-0" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShowUpdateApiKeyModal}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="!text-destructive"
            onClick={handleShowRevokeApiKeyModal}
          >
            Revoke
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
