import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';

import { EmptyText } from '@/components/ui/empty-text';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';
import type { McpRequestLogDto } from '@/types/dtos/mcp-request-log-dto';

export type McpRequestLogsProps = {
  logs: McpRequestLogDto[];
};

function StatusPill({ status }: { status: number }): React.JSX.Element {
  const failed = status >= 400;
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 font-mono text-[10px]',
        dashboardRadiusClassName,
        failed
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {status}
    </span>
  );
}

function logLabel(row: McpRequestLogDto): string {
  return row.tool || row.method;
}

export function McpRequestLogs({
  logs
}: McpRequestLogsProps): React.JSX.Element {
  if (logs.length === 0) {
    return (
      <EmptyText className="p-0 text-sm">
        No MCP calls yet. Once Cursor or Claude Code connects, requests appear
        here.
      </EmptyText>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {logs.map((row) => (
        <li
          key={row.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-xs"
        >
          <StatusPill status={row.status} />
          <code className="font-mono text-[11px] text-foreground">
            {logLabel(row)}
          </code>
          {row.method === 'tools/call' && row.tool ? (
            <span className="font-mono text-[10px] text-muted-foreground">
              {row.method}
            </span>
          ) : null}
          {row.clientName || row.apiKeyDescription ? (
            <span className="truncate text-muted-foreground">
              {row.clientName ?? row.apiKeyDescription}
            </span>
          ) : null}
          <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
            {row.durationMs}ms
          </span>
          <span className="shrink-0 text-muted-foreground">
            {formatDistanceToNow(row.createdAt, { addSuffix: true })}
          </span>
          {row.errorMessage ? (
            <p className="w-full text-[11px] text-destructive">
              {row.errorMessage}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
