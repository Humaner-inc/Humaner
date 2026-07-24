'use client';

import * as React from 'react';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import type { AuditLogDto } from '@/types/dtos/audit-log-dto';

export type AuditLogDetailModalProps = NiceModalHocProps & {
  log: AuditLogDto;
};

export const AuditLogDetailModal = NiceModal.create<AuditLogDetailModalProps>(
  ({ log }) => {
    const modal = useEnhancedModal();

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={modal.handleOpenChange}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{log.eventLabel}</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {log.eventType} ·{' '}
              {typeof log.createdAt === 'string'
                ? log.createdAt
                : log.createdAt.toISOString()}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <dl className="space-y-3 text-sm">
              <Detail
                label="Actor"
                value={
                  log.actorType === 'system'
                    ? 'System'
                    : (log.actorEmail ?? log.actorId ?? '—')
                }
              />
              <Detail
                label="IP address"
                value={log.ipAddress ?? '—'}
              />
              <Detail
                label="Resource"
                value={
                  log.resourceType
                    ? `${log.resourceType}${log.resourceId ? `: ${log.resourceId}` : ''}`
                    : '—'
                }
              />
              {log.beforeState !== undefined ? (
                <Detail
                  label="Before"
                  value={
                    <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs">
                      {JSON.stringify(log.beforeState, null, 2)}
                    </pre>
                  }
                />
              ) : null}
              {log.afterState !== undefined ? (
                <Detail
                  label="After"
                  value={
                    <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs">
                      {JSON.stringify(log.afterState, null, 2)}
                    </pre>
                  }
                />
              ) : null}
              {log.metadata !== undefined ? (
                <Detail
                  label="Metadata"
                  value={
                    <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  }
                />
              ) : null}
            </dl>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }
);

function Detail({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 break-all text-foreground">{value}</dd>
    </div>
  );
}
