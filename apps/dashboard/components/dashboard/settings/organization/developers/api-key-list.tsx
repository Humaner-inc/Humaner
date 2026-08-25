'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import {
  CheckIcon,
  KeyRoundIcon,
  MoreHorizontalIcon
} from '@humaner/shared/icons';
import { formatDistanceToNow, isBefore } from 'date-fns';

import { EditApiKeyModal } from '@/components/dashboard/settings/organization/developers/edit-api-key-modal';
import { RevokeApiKeyModal } from '@/components/dashboard/settings/organization/developers/revoke-api-key-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteActionMenuItem } from '@/components/ui/delete-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatApiKeyAccessLabel } from '@/lib/auth/api-key-scopes';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
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

function ApiKeyStatusMark({
  status
}: {
  status: ApiKeyStatus;
}): React.JSX.Element {
  if (status === 'active') {
    return (
      <span
        className="inline-flex size-4 items-center justify-center text-success"
        title="Active"
        aria-label="Active"
      >
        <CheckIcon
          className="size-3.5"
          animateOnHover={false}
        />
      </span>
    );
  }

  if (status === 'broken') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-destructive/30 px-1.5 py-0 text-[10px] font-medium tracking-wide text-destructive',
          dashboardRadiusClassName
        )}
      >
        Broken
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-border/60 px-1.5 py-0 text-[10px] font-medium tracking-wide text-muted-foreground',
        dashboardRadiusClassName
      )}
    >
      Inactive
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
          <span className="truncate text-sm font-medium">
            {apiKey.description}
          </span>
          <ApiKeyStatusMark status={status} />
          <Badge
            variant="outline"
            className={cn(
              'border-border/60 px-1.5 py-0 text-[10px] font-medium tracking-wide text-muted-foreground',
              dashboardRadiusClassName
            )}
          >
            {formatApiKeyAccessLabel(apiKey.scopes)}
          </Badge>
        </div>
        <p
          suppressHydrationWarning
          className="mt-0.5 font-info text-xs text-muted-foreground"
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
          <DeleteActionMenuItem onClick={handleShowRevokeApiKeyModal}>
            Revoke
          </DeleteActionMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
