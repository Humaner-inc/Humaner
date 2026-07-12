'use client';

import * as React from 'react';
import { CheckIcon, Loader2Icon } from '@humaner/shared/icons';
import type { SyncStatus } from '@prisma/client';
import { motion } from 'motion/react';

import { StatusPill } from '@/components/ui/status-pill';

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
      <StatusPill
        variant="success"
        iconOnly
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
            className="size-3.5"
            aria-hidden
          />
        </motion.span>
      </StatusPill>
    );
  }

  if (IN_FLIGHT_STATUSES.includes(status as keyof typeof IN_FLIGHT_LABELS)) {
    return (
      <StatusPill variant="pending">
        <Loader2Icon
          className="size-3 animate-spin"
          aria-hidden
        />
        {IN_FLIGHT_LABELS[status as keyof typeof IN_FLIGHT_LABELS]}
      </StatusPill>
    );
  }

  return <StatusPill variant="failed">Failed</StatusPill>;
}
