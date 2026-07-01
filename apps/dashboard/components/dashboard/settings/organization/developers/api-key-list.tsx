'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { formatDistanceToNow } from 'date-fns';
import { isBefore } from 'date-fns';
import { KeyRoundIcon, MoreHorizontalIcon } from '@humaner/shared/icons';

import { EditApiKeyModal } from '@/components/dashboard/settings/organization/developers/edit-api-key-modal';
import { RevokeApiKeyModal } from '@/components/dashboard/settings/organization/developers/revoke-api-key-modal';
import { Badge } from '@/components/ui/badge';
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

type ApiKeyStatus = 'active' | 'inactive' | 'broken';

function getApiKeyStatus(apiKey: ApiKeyDto): ApiKeyStatus {
  if (apiKey.expiresAt && isBefore(apiKey.expiresAt, new Date())) {
    return 'broken';
  }
  if (apiKey.lastUsedAt) {
    return 'active';
  }
  return 'inactive';
}

const STATUS_LABEL: Record<ApiKeyStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  broken: 'Broken'
};

const STATUS_CLASS: Record<ApiKeyStatus, string> = {
  active:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  inactive: 'border-border bg-muted/50 text-muted-foreground',
  broken: 'border-destructive/25 bg-destructive/10 text-destructive'
};

export function ApiKeyList({
  apiKeys,
  className,
  ...other
}: ApiKeyListProps): React.JSX.Element {
  return (
    <ul
      role="list"
      className={cn('m-0 list-none divide-y divide-border/60 p-0', className)}
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

function ApiKeyStatusBadge({ status }: { status: ApiKeyStatus }): React.JSX.Element {
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 font-normal', STATUS_CLASS[status])}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function ApiKeyListItem({
  apiKey,
  className,
  ...other
}: ApiKeyListItemProps): React.JSX.Element {
  const status = getApiKeyStatus(apiKey);

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
        'flex w-full min-w-0 items-center gap-3 px-4 py-3 sm:px-4',
        className
      )}
      {...other}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
        <KeyRoundIcon className="size-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{apiKey.description}</span>
          <ApiKeyStatusBadge status={status} />
        </div>
        <p
          suppressHydrationWarning
          className="mt-0.5 text-xs text-muted-foreground"
        >
          {status === 'broken'
            ? apiKey.expiresAt
              ? `Expired ${formatDistanceToNow(apiKey.expiresAt, { addSuffix: true })}`
              : 'Expired'
            : apiKey.lastUsedAt
              ? `Last used ${formatDistanceToNow(apiKey.lastUsedAt, { addSuffix: true })}`
              : 'No activity yet'}
        </p>
      </div>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="size-8 shrink-0 p-0"
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
