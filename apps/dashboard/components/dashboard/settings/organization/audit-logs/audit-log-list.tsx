'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { MoreHorizontalIcon } from '@humaner/shared/icons';

import { AuditLogDetailModal } from '@/components/dashboard/settings/organization/audit-logs/audit-log-detail-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { AuditLogDto } from '@/types/dtos/audit-log-dto';

export type AuditLogListProps = React.HtmlHTMLAttributes<HTMLUListElement> & {
  logs: AuditLogDto[];
};

export function AuditLogList({
  logs,
  className,
  ...other
}: AuditLogListProps): React.JSX.Element {
  return (
    <ul
      role="list"
      className={cn('m-0 list-none divide-y p-0', className)}
      {...other}
    >
      {logs.map((log) => (
        <AuditLogListItem
          key={log.id}
          log={log}
        />
      ))}
    </ul>
  );
}

type AuditLogListItemProps = React.HtmlHTMLAttributes<HTMLLIElement> & {
  log: AuditLogDto;
};

function AuditLogListItem({
  log,
  className,
  ...other
}: AuditLogListItemProps): React.JSX.Element {
  const handleShowDetails = (): void => {
    void NiceModal.show(AuditLogDetailModal, { log });
  };

  return (
    <li
      role="listitem"
      className={cn(
        'flex w-full flex-row items-start justify-between gap-4 p-6',
        className
      )}
      {...other}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span>{log.eventLabel}</span>
          <Badge variant="outline">{log.eventType}</Badge>
        </div>
        <div className="mt-1 text-xs font-normal text-muted-foreground">
          {formatDate(log.createdAt)}
          <span className="mx-1">•</span>
          <span>{formatActor(log)}</span>
          {log.ipAddress ? (
            <>
              <span className="mx-1">•</span>
              <span className="font-mono">{log.ipAddress}</span>
            </>
          ) : null}
          {log.resourceType ? (
            <>
              <span className="mx-1">•</span>
              <span>
                {log.resourceType}
                {log.resourceId ? ` ${shortId(log.resourceId)}` : ''}
              </span>
            </>
          ) : null}
        </div>
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
          <DropdownMenuItem onClick={handleShowDetails}>
            View details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function formatActor(log: AuditLogDto): string {
  if (log.actorType === 'system') {
    return 'System';
  }
  return log.actorEmail ?? log.actorId ?? 'Unknown user';
}

function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}
