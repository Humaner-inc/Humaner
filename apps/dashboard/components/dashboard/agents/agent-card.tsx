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
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon
} from '@humaner/shared/icons';
import { toast } from 'sonner';

import { deleteAgent } from '@/actions/agents/delete-agent';
import { toggleAgentPause } from '@/actions/agents/toggle-agent-pause';
import { AgentAvatarUpload } from '@/components/dashboard/agents/agent-avatar-upload';
import { DeleteAgentDialog } from '@/components/dashboard/agents/delete-agent-dialog';
import { Button } from '@/components/ui/button';
import { DeleteActionMenuItem } from '@/components/ui/delete-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getDefaultAgentTabRoute } from '@/constants/agent-nav-items';
import { agentAnalyticsRoute, agentKnowledgeRoute } from '@/constants/routes';
import type { AgentOverviewItem } from '@/data/agents/get-agents-overview';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { toSameOriginImageUrl } from '@/lib/urls/to-same-origin-image-url';
import { cn } from '@/lib/utils';

const oss = isOssDeployment();

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
        rx="0"
      />
      <rect
        x="14"
        y="5"
        width="4"
        height="14"
        rx="0"
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
  if (isPaused) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 border border-warning/30 bg-warning/10 font-info uppercase tracking-[0.08em] text-warning',
          dashboardRadiusClassName,
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        )}
      >
        <PauseGlyph className={compact ? 'size-2.5' : 'size-3'} />
        [paused]
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title="Live"
      aria-label="Live"
    >
      <span
        className={cn(
          'inline-flex size-1.5 shrink-0 bg-success',
          'rounded-full'
        )}
      />
      <span className="font-info text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        [live]
      </span>
    </span>
  );
}

function IdDotStrip({
  publicId,
  copied,
  onCopy,
  className
}: {
  publicId: string;
  copied: boolean;
  onCopy: () => void;
  className?: string;
}): React.JSX.Element {
  const maskedId = formatAgentId(publicId);

  return (
    <button
      type="button"
      onClick={onCopy}
      title={`Copy agent ID · ${publicId}`}
      className={cn(
        'group/id relative mx-auto flex h-7 w-fit max-w-[70%] items-center justify-center overflow-hidden px-3 text-foreground transition-opacity hover:opacity-100',
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 0.7px, transparent 0.8px)',
          backgroundSize: '5px 5px',
          backgroundPosition: 'center'
        }}
      />
      <span className="relative z-[1] inline-flex max-w-full items-center gap-1.5 font-mono text-[11px] text-muted-foreground/80 transition-colors group-hover/id:text-foreground/85">
        <span className="truncate">{maskedId}</span>
        <span className="shrink-0 opacity-50 transition-opacity group-hover/id:opacity-100">
          {copied ? (
            <CheckIcon className="size-3 text-success" />
          ) : (
            <CopyIcon className="size-3" />
          )}
        </span>
      </span>
    </button>
  );
}

export function AgentCard({
  agent,
  linkToWorkspace = false,
  compact = false
}: AgentCardProps): React.JSX.Element {
  const router = useRouter();
  const copyToClipboard = useCopyToClipboard();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);
  const [avatarImage, setAvatarImage] = React.useState(() =>
    toSameOriginImageUrl(agent.image)
  );
  const [isPaused, setIsPaused] = React.useState(agent.isPaused);
  const [isDeleting, startDeleteTransition] = React.useTransition();
  const [isTogglingPause, startPauseTransition] = React.useTransition();

  React.useEffect(() => {
    setAvatarImage(toSameOriginImageUrl(agent.image));
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

  const passLabel = isPaused
    ? 'PAUSED PASS'
    : agent.showRole && agent.role
      ? agent.role.toUpperCase()
      : 'AGENT PASS';

  return (
    <>
      <article
        className={cn(
          'group relative flex flex-col overflow-hidden border border-border/80 bg-muted/20 shadow-[0_2px_0_0_rgb(0_0_0_/_0.04),0_22px_48px_-24px_rgb(0_0_0_/_0.28)] transition-[border-color,box-shadow,background-color] card-interactive dark:bg-muted/20 dark:shadow-[0_2px_0_0_rgb(255_255_255_/_0.04),0_22px_48px_-24px_rgb(0_0_0_/_0.55)]',
          dashboardRadiusClassName,
          compact
            ? 'min-h-[16.5rem] px-4 pb-3.5 pt-4'
            : 'min-h-80 px-6 pb-5 pt-6',
          isPaused && 'opacity-90'
        )}
      >
        <div
          className={cn(
            'absolute left-3.5 top-3.5',
            compact ? 'left-3 top-3' : 'left-4 top-4'
          )}
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
                'absolute right-2.5 top-2.5 size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100',
                dashboardRadiusClassName,
                !compact && 'right-3.5 top-3.5 size-8'
              )}
            >
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Agent options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={getDefaultAgentTabRoute(agent.id)}>
                <PencilIcon className="mr-2 size-4" />
                {oss ? 'Edit configuration' : 'Edit persona'}
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
            'flex flex-1 flex-col items-center justify-center text-center',
            compact ? 'px-1 pt-6' : 'px-2 pt-8'
          )}
        >
          <AgentAvatarUpload
            agentId={agent.id}
            character={agent.character}
            image={avatarImage}
            size={compact ? 'compact' : 'card'}
            onImageChange={(image) => {
              setAvatarImage(image);
              router.refresh();
            }}
          />

          <h3
            className={cn(
              'mt-4 max-w-full truncate font-display font-normal leading-none tracking-tight',
              compact ? 'text-xl' : 'text-[1.5rem]'
            )}
          >
            {linkToWorkspace ? (
              <Link
                href={getDefaultAgentTabRoute(agent.id)}
                className="hover:underline"
              >
                {agent.name}
              </Link>
            ) : (
              agent.name
            )}
          </h3>

          <p className="mt-1.5 max-w-[11rem] truncate font-info text-[10px] uppercase tracking-[0.04em] text-muted-foreground">
            {passLabel}
          </p>
        </div>

        {agent.metrics.gaps.length > 0 ? (
          <div
            className={cn(
              'mt-3 flex items-center justify-center gap-2 border border-[#0b00d1]/30 bg-[#0b00d1]/10 px-2.5 py-2',
              dashboardRadiusClassName,
              compact && 'mt-2'
            )}
          >
            <AlertCircleIcon className="size-3 shrink-0 text-[#0b00d1]" />
            <p className="line-clamp-2 text-center font-info text-[10px] leading-relaxed text-[#0b00d1]">
              {agent.metrics.gaps[0]}
            </p>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-center gap-1.5">
          {linkToWorkspace ? (
            <>
              <IdDotStrip
                publicId={agent.publicId}
                copied={copiedId}
                onCopy={handleCopyId}
                className="mx-0 max-w-[min(70%,12rem)]"
              />
              {!oss ? (
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className={cn('size-8', dashboardRadiusClassName)}
                  title="Knowledge"
                >
                  <Link href={agentKnowledgeRoute(agent.id)}>
                    <BookOpenIcon
                      className="size-3.5"
                      aria-hidden
                    />
                    <span className="sr-only">Knowledge</span>
                  </Link>
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                size="icon"
                className={cn('size-8', dashboardRadiusClassName)}
                title="Analytics"
              >
                <Link href={agentAnalyticsRoute(agent.id)}>
                  <BarChart3Icon
                    className="size-3.5"
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
              className={cn('w-full', dashboardRadiusClassName)}
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

      <DeleteAgentDialog
        agentName={agent.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
