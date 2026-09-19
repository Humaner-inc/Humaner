'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { revokeMcpOAuthGrantAction } from '@/actions/developers/revoke-mcp-oauth-grant';
import { Button } from '@/components/ui/button';
import { EmptyText } from '@/components/ui/empty-text';
import type { McpOAuthGrantDto } from '@/data/developers/get-mcp-oauth-grants';
import { formatApiKeyAccessLabel } from '@/lib/auth/api-key-scopes';

export function McpOAuthClientsCard({
  grants
}: {
  grants: McpOAuthGrantDto[];
}): React.JSX.Element {
  const router = useRouter();
  const { execute, isExecuting } = useAction(revokeMcpOAuthGrantAction, {
    onSuccess: () => {
      toast.success('Client disconnected.');
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Could not disconnect.');
    }
  });

  if (grants.length === 0) {
    return (
      <EmptyText className="p-0 text-sm">
        No OAuth clients yet. Add the MCP URL in Cursor and sign in once.
      </EmptyText>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {grants.map((grant) => (
        <li
          key={grant.id}
          className="flex items-center justify-between gap-3 py-1.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{grant.clientName}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {formatApiKeyAccessLabel(grant.scopes)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 font-mono text-[10px]"
            disabled={isExecuting}
            onClick={() => execute({ id: grant.id })}
          >
            Revoke
          </Button>
        </li>
      ))}
    </ul>
  );
}
