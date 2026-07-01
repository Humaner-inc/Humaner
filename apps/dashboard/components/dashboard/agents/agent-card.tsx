'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon
} from '@humaner/shared/icons';
import { toast } from 'sonner';

import { deleteAgent } from '@/actions/agents/delete-agent';
import { AgentAvatarUpload } from '@/components/dashboard/agents/agent-avatar-upload';
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
  const [avatarImage, setAvatarImage] = React.useState(agent.image);
  const [isDeleting, startDeleteTransition] = React.useTransition();

  React.useEffect(() => {
    setAvatarImage(agent.image);
  }, [agent.image]);

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
      <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:border-foreground/15 hover:shadow-md">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
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

        <div className="flex flex-col items-center text-center">
          <AgentAvatarUpload
            agentId={agent.id}
            character={agent.character}
            image={avatarImage}
            size="card"
            onImageChange={(image) => {
              setAvatarImage(image);
              router.refresh();
            }}
          />

          <h3 className="mt-4 max-w-full truncate font-display text-xl leading-tight tracking-tight">
            {agent.name}
          </h3>
          {agent.showRole ? (
            <p className="mt-1 max-w-full truncate text-sm text-muted-foreground">
              {agent.role}
            </p>
          ) : null}
          <span className="mt-2.5 inline-flex rounded-full border border-border/80 bg-muted/30 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {meta.label}
          </span>

          <button
            type="button"
            onClick={handleCopyId}
            title={agent.publicId}
            className="group/id mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <KeyRoundIcon className="size-3 shrink-0 opacity-70" />
            <span className="truncate font-mono">
              {formatAgentId(agent.publicId)}
            </span>
            <span className="shrink-0 opacity-60 transition-opacity group-hover/id:opacity-100">
              {copiedId ? (
                <CheckIcon className="size-3 text-emerald-500" />
              ) : (
                <CopyIcon className="size-3" />
              )}
            </span>
          </button>
        </div>

        {agent.metrics.gaps.length > 0 ? (
          <div className="mt-5 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="line-clamp-2 text-left text-[11px] leading-relaxed text-muted-foreground">
              {agent.metrics.gaps[0]}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`${Routes.Analytics}?agent=${agent.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-border/80 py-2.5 text-sm font-medium transition-colors hover:border-foreground/20 hover:bg-muted/40"
          >
            Analytics
          </Link>
          <Link
            href={`${Routes.Knowledge}?agent=${agent.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-border/80 py-2.5 text-sm font-medium transition-colors hover:border-foreground/20 hover:bg-muted/40"
          >
            Knowledge
            <ArrowUpRightIcon className="size-3.5 text-muted-foreground" />
          </Link>
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
