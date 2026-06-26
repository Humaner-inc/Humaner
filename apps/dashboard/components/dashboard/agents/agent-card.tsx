'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
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

function formatAgentId(publicId: string): string {
  if (publicId.length <= 14) {
    return publicId;
  }

  return `${publicId.slice(0, 8)}…${publicId.slice(-4)}`;
}

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
      <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md sm:flex-row">
        <div className="relative h-36 shrink-0 overflow-hidden sm:h-auto sm:w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.image}
            alt={meta.label}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent sm:bg-gradient-to-r sm:from-black/50 sm:via-transparent sm:to-transparent" />
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 bg-background/80 backdrop-blur-sm"
          >
            {meta.label}
          </Badge>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="truncate font-display text-lg leading-none">
                {agent.name}
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                {agent.role}
              </p>
              <button
                type="button"
                onClick={handleCopyId}
                title={agent.publicId}
                className="group/id inline-flex max-w-full items-center gap-1.5 rounded-md py-0.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <KeyRoundIcon className="size-3 shrink-0 opacity-70" />
                <span className="truncate font-mono">
                  {formatAgentId(agent.publicId)}
                </span>
                <span className="shrink-0 opacity-0 transition-opacity group-hover/id:opacity-100">
                  {copiedId ? (
                    <CheckIcon className="size-3 text-emerald-500" />
                  ) : (
                    <CopyIcon className="size-3" />
                  )}
                </span>
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground"
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

          <div className="mt-4 border-t pt-4">
            <AgentMetricBars
              satisfaction={agent.metrics.satisfaction}
              expertise={agent.metrics.expertise}
            />
          </div>

          {agent.metrics.gaps.length > 0 && (
            <div className="group/gaps mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 transition-colors hover:bg-amber-500/10">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                <AlertCircleIcon className="size-3 shrink-0" />
                Gaps
              </div>
              <p className="max-h-0 overflow-hidden text-xs leading-relaxed text-muted-foreground opacity-0 transition-all duration-200 group-hover/gaps:mt-1.5 group-hover/gaps:max-h-24 group-hover/gaps:opacity-100">
                {agent.metrics.gaps[0]}
              </p>
            </div>
          )}

          <div className="mt-4 pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Link href={`${Routes.Knowledge}?agent=${agent.id}`}>
                Manage knowledge
              </Link>
            </Button>
          </div>
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
