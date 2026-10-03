'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { updateMcpIntelligence } from '@/actions/developers/update-mcp-intelligence';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function McpIntelligenceToggle({
  enabled
}: {
  enabled: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [checked, setChecked] = React.useState(enabled);
  const { execute, isExecuting } = useAction(updateMcpIntelligence, {
    onSuccess: () => {
      router.refresh();
    },
    onError: ({ error }) => {
      setChecked(enabled);
      toast.error(error.serverError || 'Could not update intelligence mode');
    }
  });

  React.useEffect(() => {
    setChecked(enabled);
  }, [enabled]);

  return (
    <div className="flex items-start justify-between gap-4 rounded-md border px-4 py-3">
      <Label
        htmlFor="mcp-intelligence"
        className="space-y-1"
      >
        <span className="text-sm font-medium">Intelligence over MCP</span>
        <span className="block text-xs font-normal text-muted-foreground">
          {checked
            ? 'Your own agent gets knowledge search over MCP (full-text, not Hybrid RAG). The in-app Companion is hidden.'
            : 'Companion runs Hybrid RAG in-app. Turn on to hand knowledge search (FTS) to your own agent over MCP and hide Companion.'}
        </span>
      </Label>
      <Switch
        id="mcp-intelligence"
        checked={checked}
        disabled={isExecuting}
        onCheckedChange={(next) => {
          setChecked(next);
          execute({ enabled: next });
        }}
      />
    </div>
  );
}
