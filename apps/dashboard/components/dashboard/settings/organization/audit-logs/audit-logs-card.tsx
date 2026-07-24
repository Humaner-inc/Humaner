'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { AuditLogList } from '@/components/dashboard/settings/organization/audit-logs/audit-log-list';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import { EmptyText } from '@/components/ui/empty-text';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { AuditLogDto } from '@/types/dtos/audit-log-dto';

export type AuditLogsCardProps = CardProps & {
  logs: AuditLogDto[];
};

export function AuditLogsCard({
  logs,
  className,
  ...other
}: AuditLogsCardProps): React.JSX.Element {
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async (format: 'json' | 'csv'): Promise<void> => {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/dashboard/audit-logs/export?format=${format}`,
        { method: 'POST' }
      );
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `humaner-audit-logs.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Audit logs exported');
    } catch {
      toast.error('Could not export audit logs');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card
      className={cn('flex h-full flex-col', className)}
      {...other}
    >
      <CardContent className="max-h-[28rem] flex-1 overflow-hidden p-0">
        {logs.length > 0 ? (
          <ScrollArea className="h-full">
            <AuditLogList logs={logs} />
          </ScrollArea>
        ) : (
          <EmptyText className="p-6">
            No audit events recorded yet. Administrative and security actions
            will appear here.
          </EmptyText>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full flex-wrap justify-end gap-2 pt-6">
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={exporting}
          onClick={() => void handleExport('csv')}
        >
          Export CSV
        </Button>
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={exporting}
          onClick={() => void handleExport('json')}
        >
          Export JSON
        </Button>
      </CardFooter>
    </Card>
  );
}
