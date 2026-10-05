'use client';

import * as React from 'react';
import { ArrowDownIcon, Paperclip } from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';

import { listMailThreadAttachments } from '@/actions/inbox/list-mail-attachments';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  formatAttachmentSize,
  mailAttachmentDownloadPath
} from '@/lib/inbox/mail-attachment-format';
import { cn } from '@/lib/utils';

export type MailAttachmentChip = {
  id: string;
  filename: string;
  mediaType: string;
  sizeBytes: number;
};

function downloadAttachment(id: string): void {
  window.location.assign(mailAttachmentDownloadPath(id));
}

export function MailAttachmentsMenu({
  attachments,
  className,
  size = 'header'
}: {
  attachments: MailAttachmentChip[];
  className?: string;
  size?: 'header' | 'row';
}): React.JSX.Element | null {
  if (attachments.length === 0) return null;

  const buttonClass =
    size === 'row'
      ? 'size-7 rounded-lg bg-background/95 shadow-sm'
      : 'size-8 rounded-lg';

  if (attachments.length === 1) {
    const only = attachments[0]!;
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(buttonClass, className)}
        title={`Download ${only.filename}`}
        onClick={(event) => {
          event.stopPropagation();
          downloadAttachment(only.id);
        }}
      >
        <ArrowDownIcon className="size-4" />
        <span className="sr-only">Download {only.filename}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(buttonClass, className)}
          title="Download attachments"
          onClick={(event) => event.stopPropagation()}
        >
          <ArrowDownIcon className="size-4" />
          <span className="sr-only">Download attachments</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-56"
      >
        {attachments.map((attachment) => (
          <DropdownMenuItem
            key={attachment.id}
            onSelect={() => downloadAttachment(attachment.id)}
          >
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="ml-2 min-w-0 flex-1 truncate">
              {attachment.filename}
            </span>
            <span className="ml-2 shrink-0 font-mono text-[10px] text-muted-foreground">
              {formatAttachmentSize(attachment.sizeBytes)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MailThreadAttachmentsControl({
  threadId,
  hasAttachments,
  attachments,
  size = 'header',
  className
}: {
  threadId: string;
  hasAttachments: boolean;
  attachments?: MailAttachmentChip[];
  size?: 'header' | 'row';
  className?: string;
}): React.JSX.Element | null {
  const [loaded, setLoaded] = React.useState<MailAttachmentChip[]>(
    () => attachments ?? []
  );
  const { executeAsync, isExecuting } = useAction(listMailThreadAttachments);

  React.useEffect(() => {
    setLoaded(attachments ?? []);
  }, [attachments]);

  if (!hasAttachments && loaded.length === 0) return null;

  if (loaded.length > 0) {
    return (
      <MailAttachmentsMenu
        attachments={loaded}
        size={size}
        className={className}
      />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        size === 'row'
          ? 'size-7 rounded-lg bg-background/95 shadow-sm'
          : 'size-8 rounded-lg',
        className
      )}
      disabled={isExecuting}
      title="Download attachments"
      onClick={(event) => {
        event.stopPropagation();
        void executeAsync({ threadId }).then((result) => {
          const rows = result?.data;
          if (!Array.isArray(rows) || rows.length === 0) return;
          setLoaded(rows);
          if (rows.length === 1) {
            downloadAttachment(rows[0]!.id);
          }
        });
      }}
    >
      <ArrowDownIcon className="size-4" />
      <span className="sr-only">Download attachments</span>
    </Button>
  );
}

export function MailMessageAttachmentChips({
  attachments
}: {
  attachments: MailAttachmentChip[];
}): React.JSX.Element | null {
  if (attachments.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <a
            href={mailAttachmentDownloadPath(attachment.id)}
            className="inline-flex max-w-64 items-center gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/60"
          >
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate">{attachment.filename}</span>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {formatAttachmentSize(attachment.sizeBytes)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
