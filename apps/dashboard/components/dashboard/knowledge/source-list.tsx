'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileTextIcon,
  GlobeIcon,
  NetworkIcon,
  PlugIcon,
  RefreshCwIcon,
  Trash2Icon
} from '@humaner/shared/icons';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import type { SourceType } from '@prisma/client';
import { toast } from 'sonner';

import { deleteKnowledgeSource } from '@/actions/knowledge/delete-knowledge-source';
import { rescanKnowledgeSourceAction } from '@/actions/knowledge/rescan-knowledge-source';
import { useOptionalKnowledgeResources } from '@/components/dashboard/knowledge/knowledge-resources-shell';
import { KnowledgeSourceStatus } from '@/components/dashboard/knowledge/knowledge-source-status';
import { Button } from '@/components/ui/button';
import { deleteIconButtonClassName } from '@/components/ui/delete-action-button';
import { ListRowActions } from '@/components/ui/status-pill';
import type { KnowledgeSourceItem } from '@/data/knowledge/get-knowledge-sources';
import { dashboardListSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<SourceType, typeof GlobeIcon> = {
  URL: GlobeIcon,
  SITEMAP: NetworkIcon,
  PDF: FileTextIcon,
  TEXT: FileTextIcon,
  API: PlugIcon
};

const REMOTE_SOURCE_TYPES: SourceType[] = ['URL', 'SITEMAP', 'API'];

const listRowIconButtonClassName =
  'size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/60';

export type SourceListProps = {
  sources: KnowledgeSourceItem[];
  onSourceRemoved?: (id: string) => void;
};

export function SourceList({
  sources,
  onSourceRemoved
}: SourceListProps): React.JSX.Element {
  const router = useRouter();
  const knowledgeResources = useOptionalKnowledgeResources();
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null
  );
  const [pendingRescanId, setPendingRescanId] = React.useState<string | null>(
    null
  );

  const handleDelete = async (id: string): Promise<void> => {
    if (id.startsWith('optimistic-')) {
      onSourceRemoved?.(id);
      return;
    }

    onSourceRemoved?.(id);
    setPendingDeleteId(id);
    try {
      const result = await deleteKnowledgeSource({ id });
      if (result?.serverError) {
        toast.error(result.serverError);
        router.refresh();
        return;
      }
      toast.success('Source removed');
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleRescan = async (source: KnowledgeSourceItem): Promise<void> => {
    if (source.id.startsWith('optimistic-')) {
      return;
    }

    setPendingRescanId(source.id);
    knowledgeResources?.markSourcePending(source.id);

    try {
      const result = await rescanKnowledgeSourceAction({ id: source.id });
      if (result?.serverError) {
        toast.error(result.serverError);
        router.refresh();
        return;
      }

      if (!result?.data?.queued) {
        toast.error('Only scraped URLs and sitemaps can be rescanned');
        router.refresh();
        return;
      }

      toast.success('Rescan started');
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setPendingRescanId(null);
    }
  };

  return (
    <ul className={dashboardListSurfaceClassName}>
      {sources.map((source) => {
        const TypeIcon = TYPE_ICON[source.type];
        const canRescan = REMOTE_SOURCE_TYPES.includes(source.type);
        const isRescanning = pendingRescanId === source.id;
        const isInFlight = [
          'PENDING',
          'QUEUED',
          'EXTRACTING',
          'PROCESSING',
          'INDEXING'
        ].includes(source.status);

        return (
          <li
            key={source.id}
            className="flex items-center gap-4 p-4"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
              <TypeIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{source.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {source.url ?? 'Pasted text'}
              </p>
              {source.status === 'FAILED' && source.errorMessage && (
                <p className="mt-1 line-clamp-2 text-xs text-destructive">
                  {source.errorMessage}
                </p>
              )}
            </div>
            <ListRowActions>
              <KnowledgeSourceStatus
                sourceId={source.id}
                status={source.status}
              />
              {canRescan ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    listRowIconButtonClassName,
                    'hover:text-foreground'
                  )}
                  aria-label="Rescan source"
                  title="Rescan source"
                  disabled={
                    isRescanning || isInFlight || pendingDeleteId === source.id
                  }
                  onClick={() => handleRescan(source)}
                >
                  {isRescanning ? (
                    <SquircleLoader />
                  ) : (
                    <RefreshCwIcon
                      className="size-4"
                      aria-hidden
                    />
                  )}
                  <span className="sr-only">Rescan source</span>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={deleteIconButtonClassName}
                aria-label="Delete source"
                disabled={
                  pendingDeleteId === source.id || pendingRescanId === source.id
                }
                onClick={() => handleDelete(source.id)}
              >
                <Trash2Icon
                  className={cn(
                    'size-4',
                    pendingDeleteId === source.id && 'animate-pulse'
                  )}
                  aria-hidden
                />
                <span className="sr-only">Delete source</span>
              </Button>
            </ListRowActions>
          </li>
        );
      })}
    </ul>
  );
}
