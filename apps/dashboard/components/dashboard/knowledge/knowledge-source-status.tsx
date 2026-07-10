'use client';

import * as React from 'react';
import { Loader2Icon } from '@humaner/shared/icons';
import type { SyncStatus } from '@prisma/client';

import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  FileCheckIcon,
  type FileCheckIconHandle
} from '@/components/ui/file-check-icon';

const STATUS_META: Record<
  Exclude<SyncStatus, 'READY'>,
  { label: string; variant: BadgeProps['variant'] }
> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  QUEUED: { label: 'Queued', variant: 'secondary' },
  EXTRACTING: { label: 'Extracting', variant: 'secondary' },
  PROCESSING: { label: 'Processing', variant: 'secondary' },
  INDEXING: { label: 'Indexing', variant: 'secondary' },
  FAILED: { label: 'Failed', variant: 'destructive' }
};

const IN_FLIGHT_STATUSES: SyncStatus[] = [
  'PENDING',
  'QUEUED',
  'EXTRACTING',
  'PROCESSING',
  'INDEXING'
];

type KnowledgeSourceStatusProps = {
  status: SyncStatus;
  sourceId: string;
};

export function KnowledgeSourceStatus({
  status,
  sourceId
}: KnowledgeSourceStatusProps): React.JSX.Element {
  const iconRef = React.useRef<FileCheckIconHandle>(null);
  const prevStatusRef = React.useRef<SyncStatus | null>(null);

  React.useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (status !== 'READY') {
      return;
    }

    const justBecameReady =
      prev !== null && prev !== 'READY' && status === 'READY';

    if (justBecameReady || prev === null) {
      const timer = window.setTimeout(() => {
        iconRef.current?.startAnimation();
      }, 80);
      return () => window.clearTimeout(timer);
    }
  }, [status, sourceId]);

  if (status === 'READY') {
    return (
      <div
        className="flex shrink-0 items-center justify-center text-primary"
        title="Ingested and ready"
        aria-label="Ingested and ready"
      >
        <FileCheckIcon
          ref={iconRef}
          size={24}
        />
      </div>
    );
  }

  if (IN_FLIGHT_STATUSES.includes(status)) {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5"
      >
        <Loader2Icon
          className="size-3 animate-spin text-muted-foreground"
          aria-hidden
        />
        {STATUS_META[status].label}
      </Badge>
    );
  }

  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
