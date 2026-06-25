'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon
} from '@humaner/shared/icons';
import { toast } from 'sonner';

import { deleteAgent } from '@/actions/agents/delete-agent';
import { AgentMetricBars } from '@/components/dashboard/agents/agent-metric-bars';
import { EditAgentDialog } from '@/components/dashboard/agents/edit-agent-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Routes } from '@/constants/routes';
import type { AgentOverviewItem } from '@/data/agents/get-agents-overview';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { CHARACTER_META } from '@/lib/character-presets';

export type AgentCardProps = {
  agent: AgentOverviewItem;
};

export function AgentCard({ agent }: AgentCardProps): React.JSX.Element {
  const router = useRouter();
  const meta = CHARACTER_META[agent.character];
  const copyToClipboard = useCopyToClipboard();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);
  const [isDeleting, startDeleteTransition] = React.useTransition();

  const handleCopyId = async (): Promise<void> => {
    await copyToClipboard(agent.publicId);
    setCopiedId(true);
    toast.success('Agent ID copied');
    window.setTimeout(() => setCopiedId(false), 1500);
  };

  const handleDelete = (): void => {
    startDeleteTransition(async () => {
      const result = await deleteAgent({ id: agent.id });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error("Couldn't delete agent");
        return;
      }
      toast.success('Agent deleted');
      setDeleteOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
        <div className="relative h-28 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.image}
            alt={meta.label}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 bg-background/80 backdrop-blur-sm"
          >
            {meta.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 size-8 bg-background/80 backdrop-blur-sm"
              >
                <MoreHorizontalIcon className="size-4" />
                <span className="sr-only">Agent options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <PencilIcon className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-lg leading-none">{agent.name}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{agent.role}</p>

          <div className="mt-4 border-t pt-4">
            <AgentMetricBars
              satisfaction={agent.metrics.satisfaction}
              expertise={agent.metrics.expertise}
            />
          </div>

          {agent.metrics.gaps.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                <AlertCircleIcon className="size-3 shrink-0" />
                Gaps
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {agent.metrics.gaps[0]}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5">
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              Agent ID
            </span>
            <code className="min-w-0 flex-1 truncate font-mono text-xs">
              {agent.publicId}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={handleCopyId}
              aria-label="Copy agent ID"
              title="Use this ID with your API key to call the chat API"
            >
              {copiedId ? (
                <CheckIcon className="size-3.5 text-emerald-500" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </Button>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-3 w-full"
          >
            <Link href={`${Routes.Knowledge}?agent=${agent.id}`}>
              Manage knowledge
            </Link>
          </Button>
        </div>
      </article>

      <EditAgentDialog
        agent={agent}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {agent.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the agent and all linked knowledge sources. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete agent'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
