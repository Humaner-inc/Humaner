'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircleIcon,
  BarChart3Icon,
  BookOpenIcon,
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon
} from '@humaner/shared/icons';
import { toast } from 'sonner';

import { deleteAgent } from '@/actions/agents/delete-agent';
import { toggleAgentPause } from '@/actions/agents/toggle-agent-pause';
import { AgentAvatarUpload } from '@/components/dashboard/agents/agent-avatar-upload';
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
import { DeleteActionMenuItem } from '@/components/ui/delete-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  agentAnalyticsRoute,
  agentKnowledgeRoute,
  agentPersonaRoute
} from '@/constants/routes';
import type { AgentOverviewItem } from '@/data/agents/get-agents-overview';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { CHARACTER_META } from '@/lib/character-presets';
import { cn } from '@/lib/utils';

export type AgentCardProps = {
  agent: AgentOverviewItem;
  linkToWorkspace?: boolean;
  /** Tighter layout for overview grids. */
  compact?: boolean;
};

function formatAgentId(publicId: string): string {
  if (publicId.length <= 14) {
    return publicId;
  }

  return `${publicId.slice(0, 8)}…${publicId.slice(-4)}`;
}

function PauseGlyph({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <rect
        x="6"
        y="5"
        width="4"
        height="14"
        rx="1"
      />
      <rect
        x="14"
        y="5"
        width="4"
        height="14"
        rx="1"
      />
    </svg>
  );
}

function AgentStatusBadge({
  isPaused,
  compact = false
}: {
  isPaused: boolean;
  compact?: boolean;
}): React.JSX.Element {
  const sizeClass = compact
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-0.5 text-[11px]';

  if (isPaused) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 border border-amber-500/30 bg-amber-500/10 font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300',
          sizeClass
        )}
      >
        <PauseGlyph className={compact ? 'size-2.5' : 'size-3'} />
        Paused
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300',
        sizeClass
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

export function AgentCard({
  agent,
  linkToWorkspace = false,
  compact = false
}: AgentCardProps): React.JSX.Element {
  const router = useRouter();
  const meta = CHARACTER_META[agent.character];
  const copyToClipboard = useCopyToClipboard();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);
  const [avatarImage, setAvatarImage] = React.useState(agent.image);
  const [isPaused, setIsPaused] = React.useState(agent.isPaused);
  const [isDeleting, startDeleteTransition] = React.useTransition();
  const [isTogglingPause, startPauseTransition] = React.useTransition();

  React.useEffect(() => {
    setAvatarImage(agent.image);
  }, [agent.image]);

  React.useEffect(() => {
    setIsPaused(agent.isPaused);
  }, [agent.isPaused]);

  const handleCopyId = async (): Promise<void> => {
    await copyToClipboard(agent.publicId);
    setCopiedId(true);
    toast.success('Agent ID copied');
    window.setTimeout(() => setCopiedId(false), 1500);
  };

  const handleTogglePause = (): void => {
    const nextPaused = !isPaused;
    startPauseTransition(async () => {
      const result = await toggleAgentPause({
        id: agent.id,
        isPaused: nextPaused
      });
      if (result?.serverError || result?.validationErrors) {
        toast.error("Couldn't update agent status");
        return;
      }
      setIsPaused(nextPaused);
      toast.success(nextPaused ? 'Agent paused' : 'Agent is live');
      router.refresh();
    });
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
      <article
        className={cn(
          'group relative flex flex-col overflow-hidden border border-border/60 bg-card transition-colors card-interactive',
          compact ? 'p-4' : 'p-5',
          isPaused && 'opacity-90'
        )}
      >
        <div
          className={cn('absolute left-2.5 top-2.5', compact && 'left-2 top-2')}
        >
          <AgentStatusBadge
            isPaused={isPaused}
            compact={compact}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'absolute right-2 top-2 size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100',
                !compact && 'right-3 top-3 size-8'
              )}
            >
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Agent options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={agentPersonaRoute(agent.id)}>
                <PencilIcon className="mr-2 size-4" />
                Edit persona
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleTogglePause}
              disabled={isTogglingPause}
            >
              {isPaused ? (
                <>
                  <PlayIcon className="mr-2 size-4" />
                  Resume agent
                </>
              ) : (
                <>
                  <PauseGlyph className="mr-2 size-4" />
                  Pause agent
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteActionMenuItem onClick={() => setDeleteOpen(true)}>
              Delete
            </DeleteActionMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div
          className={cn(
            'flex flex-col items-center text-center',
            compact ? 'pt-5' : 'pt-6'
          )}
        >
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

          <h3
            className={cn(
              'mt-3 max-w-full truncate font-mono font-medium leading-tight tracking-tight',
              compact ? 'text-base' : 'text-xl font-display'
            )}
          >
            {linkToWorkspace ? (
              <Link
                href={agentPersonaRoute(agent.id)}
                className="hover:underline"
              >
                {agent.name}
              </Link>
            ) : (
              agent.name
            )}
          </h3>
          {agent.showRole ? (
            <p className="mt-0.5 max-w-full truncate text-xs text-muted-foreground">
              {agent.role}
            </p>
          ) : null}
          {!compact ? (
            <span className="mt-2 inline-flex rounded-full border border-border/80 bg-muted/30 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {meta.label}
            </span>
          ) : null}

          <button
            type="button"
            onClick={handleCopyId}
            title={agent.publicId}
            className={cn(
              'group/id mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background/50 text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground',
              compact
                ? 'px-2 py-0.5 text-[10px]'
                : 'mt-3 px-2.5 py-1 text-[11px]'
            )}
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
          <div
            className={cn(
              'mt-3 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-2.5 py-2',
              compact && 'mt-2'
            )}
          >
            <AlertCircleIcon className="mt-0.5 size-3 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="line-clamp-2 text-left text-[10px] leading-relaxed text-muted-foreground">
              {agent.metrics.gaps[0]}
            </p>
          </div>
        ) : null}

        <div
          className={cn(
            'mt-3 flex justify-center gap-1.5',
            !compact && 'mt-4 gap-2'
          )}
        >
          {linkToWorkspace ? (
            <>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="size-9 rounded-xl"
                title="Knowledge"
              >
                <Link href={agentKnowledgeRoute(agent.id)}>
                  <BookOpenIcon
                    className="size-4"
                    aria-hidden
                  />
                  <span className="sr-only">Knowledge</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="size-9 rounded-xl"
                title="Analytics"
              >
                <Link href={agentAnalyticsRoute(agent.id)}>
                  <BarChart3Icon
                    className="size-4"
                    aria-hidden
                  />
                  <span className="sr-only">Analytics</span>
                </Link>
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={handleTogglePause}
              loading={isTogglingPause}
            >
              {isPaused ? (
                <>
                  <PlayIcon className="mr-2 size-4" />
                  Resume agent
                </>
              ) : (
                <>
                  <PauseGlyph className="mr-2 size-4" />
                  Pause agent
                </>
              )}
            </Button>
          )}
        </div>
      </article>

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
              variant="destructive"
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
