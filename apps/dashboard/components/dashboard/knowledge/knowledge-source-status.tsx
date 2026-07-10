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
  PENDING: { label: 'Queued', variant: 'secondary' },
  PROCESSING: { label: 'Processing', variant: 'secondary' },
  FAILED: { label: 'Failed', variant: 'destructive' }
};

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

  if (status === 'PROCESSING' || status === 'PENDING') {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5"
      >
        <Loader2Icon
          className="size-3 animate-spin text-muted-foreground"
          aria-hidden
        />
        {status === 'PENDING' ? 'Queued' : 'Processing'}
      </Badge>
    );
  }

  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
