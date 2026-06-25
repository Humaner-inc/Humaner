'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { SourceType } from '@prisma/client';
import {
  FileTextIcon,
  GlobeIcon,
  NetworkIcon,
  PlugIcon,
  Trash2Icon
} from '@humaner/shared/icons';
import { toast } from 'sonner';

import { deleteKnowledgeSource } from '@/actions/knowledge/delete-knowledge-source';
import { KnowledgeSourceStatus } from '@/components/dashboard/knowledge/knowledge-source-status';
import { Button } from '@/components/ui/button';
import type { KnowledgeSourceItem } from '@/data/knowledge/get-knowledge-sources';

const TYPE_ICON: Record<SourceType, typeof GlobeIcon> = {
  URL: GlobeIcon,
  SITEMAP: NetworkIcon,
  PDF: FileTextIcon,
  TEXT: FileTextIcon,
  API: PlugIcon
};

export type SourceListProps = {
  sources: KnowledgeSourceItem[];
};

export function SourceList({ sources }: SourceListProps): React.JSX.Element {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string): Promise<void> => {
    setPendingId(id);
    try {
      const result = await deleteKnowledgeSource({ id });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success('Source removed');
      router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <ul className="divide-y rounded-xl border">
      {sources.map((source) => {
        const TypeIcon = TYPE_ICON[source.type];
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
            <KnowledgeSourceStatus
              sourceId={source.id}
              status={source.status}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              loading={pendingId === source.id}
              disabled={pendingId === source.id}
              onClick={() => handleDelete(source.id)}
            >
              <Trash2Icon className="size-4" />
              <span className="sr-only">Delete source</span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
