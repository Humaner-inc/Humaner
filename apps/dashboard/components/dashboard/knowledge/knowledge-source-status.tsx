'use client';

import * as React from 'react';
import { CheckIcon, TriangleAlertIcon } from '@humaner/shared/icons';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import type { SyncStatus } from '@prisma/client';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

const IN_FLIGHT_LABELS: Record<
  Extract<
    SyncStatus,
    'PENDING' | 'QUEUED' | 'EXTRACTING' | 'PROCESSING' | 'INDEXING'
  >,
  string
> = {
  PENDING: 'Pending',
  QUEUED: 'Queued',
  EXTRACTING: 'Extracting',
  PROCESSING: 'Processing',
  INDEXING: 'Indexing'
};

const IN_FLIGHT_STATUSES = Object.keys(
  IN_FLIGHT_LABELS
) as (keyof typeof IN_FLIGHT_LABELS)[];

const statusIndicatorClassName =
  'flex size-8 shrink-0 items-center justify-center text-muted-foreground';

type KnowledgeSourceStatusProps = {
  status: SyncStatus;
  sourceId: string;
};

export function KnowledgeSourceStatus({
  status,
  sourceId
}: KnowledgeSourceStatusProps): React.JSX.Element {
  const prevStatusRef = React.useRef<SyncStatus | null>(null);
  const [justReady, setJustReady] = React.useState(false);

  React.useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (
      status === 'READY' &&
      prev !== null &&
      prev !== 'READY' &&
      IN_FLIGHT_STATUSES.includes(prev as keyof typeof IN_FLIGHT_LABELS)
    ) {
      setJustReady(true);
      const timer = window.setTimeout(() => setJustReady(false), 600);
      return () => window.clearTimeout(timer);
    }
  }, [status, sourceId]);

  if (status === 'READY') {
    return (
      <span
        className={statusIndicatorClassName}
        title="Ingested and ready"
        aria-label="Ingested and ready"
      >
        <motion.span
          initial={justReady ? { scale: 0.6, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="flex items-center justify-center"
        >
          <CheckIcon
            className="size-4 text-success"
            aria-hidden
          />
        </motion.span>
      </span>
    );
  }

  if (IN_FLIGHT_STATUSES.includes(status as keyof typeof IN_FLIGHT_LABELS)) {
    return (
      <span
        className={statusIndicatorClassName}
        title={IN_FLIGHT_LABELS[status as keyof typeof IN_FLIGHT_LABELS]}
        aria-label={IN_FLIGHT_LABELS[status as keyof typeof IN_FLIGHT_LABELS]}
      >
        <SquircleLoader />
      </span>
    );
  }

  return (
    <span
      className={cn(statusIndicatorClassName, 'text-destructive')}
      title="Failed"
      aria-label="Failed"
    >
      <TriangleAlertIcon
        className="size-4"
        aria-hidden
      />
    </span>
  );
}
