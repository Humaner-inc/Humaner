'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@humaner/shared/icons';
import { toast } from 'sonner';

import { addSupportTicketMessage } from '@/actions/support-tickets/add-support-ticket-message';
import {
  getSupportTicketDetail,
  type SupportTicketDetailDto
} from '@/actions/support-tickets/get-support-ticket-detail';
import { updateSupportTicketStatus } from '@/actions/support-tickets/update-support-ticket-status';
import { SupportTicketInboxFilterDropdown } from '@/components/support/support-ticket-inbox-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { reportBugTabLabel } from '@/lib/report-bug-context-options';
import {
  sortSupportTicketsInboxOrder,
  supportTicketStatusDotClass,
  supportTicketStatusLabel,
  type SupportTicketInboxFilter
} from '@/lib/support-ticket-labels';
import { cn } from '@/lib/utils';

const STATUS_VALUES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED'
] as const;

export type SupportTicketInboxListRow = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  requesterName?: string;
  requesterEmail?: string | null;
};

export type SupportTicketInboxProps = {
  tickets: SupportTicketInboxListRow[];
  emptyMessage: string;
  className?: string;
};

export function SupportTicketInbox({
  tickets,
  emptyMessage,
  className
}: SupportTicketInboxProps): React.JSX.Element {
  const [statusFilter, setStatusFilter] =
    React.useState<SupportTicketInboxFilter>('all');

  const sortedSource = React.useMemo(
    () =>
      sortSupportTicketsInboxOrder(
        tickets.map((ticket) => ({
          ...ticket,
          updatedAt: new Date(ticket.updatedAt)
        }))
      ).map((ticket) => ({
        ...ticket,
        updatedAt: ticket.updatedAt.toISOString()
      })),
    [tickets]
  );

  const displayTickets = React.useMemo(() => {
    if (statusFilter === 'all') return sortedSource;
    return sortedSource.filter((ticket) => ticket.status === statusFilter);
  }, [sortedSource, statusFilter]);

  const [selectedId, setSelectedId] = React.useState<string | null>(() => {
    return sortedSource[0]?.id ?? null;
  });

  React.useEffect(() => {
    if (displayTickets.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((previous) => {
      if (previous && displayTickets.some((ticket) => ticket.id === previous)) {
        return previous;
      }
      return displayTickets[0]!.id;
    });
  }, [displayTickets]);

  const [detail, setDetail] = React.useState<SupportTicketDetailDto | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [reply, setReply] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [mobileShowDetail, setMobileShowDetail] = React.useState(false);
  const [statusUpdating, setStatusUpdating] = React.useState(false);

  const loadDetail = React.useCallback(async (id: string) => {
    setLoadingDetail(true);
    const result = await getSupportTicketDetail({ ticketId: id });
    if (result?.data) {
      setDetail(result.data);
    } else if (result?.serverError) {
      toast.error(result.serverError);
      setDetail(null);
    }
    setLoadingDetail(false);
  }, []);

  React.useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const handleSend = async (): Promise<void> => {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    const result = await addSupportTicketMessage({
      ticketId: selectedId,
      body: reply.trim()
    });
    setSending(false);
    if (result?.serverError) {
      toast.error(result.serverError);
      return;
    }
    setReply('');
    toast.success('Reply sent');
    await loadDetail(selectedId);
  };

  const handleStatus = async (value: string): Promise<void> => {
    if (!selectedId) return;
    setStatusUpdating(true);
    const result = await updateSupportTicketStatus({
      ticketId: selectedId,
      status: value as (typeof STATUS_VALUES)[number]
    });
    setStatusUpdating(false);
    if (result?.serverError) {
      toast.error(result.serverError);
      return;
    }
    toast.success('Status updated');
    await loadDetail(selectedId);
  };

  const list = (
    <div className="flex h-full min-h-0 flex-col border-border/60 md:border-r">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-2 sm:px-3">
        <p className="min-w-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Inbox
        </p>
        {sortedSource.length > 0 ? (
          <SupportTicketInboxFilterDropdown
            value={statusFilter}
            onValueChange={setStatusFilter}
            align="end"
          />
        ) : null}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col p-1">
          {sortedSource.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{emptyMessage}</p>
          ) : displayTickets.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              No tickets match this filter.
            </p>
          ) : (
            displayTickets.map((ticket) => {
              const active = ticket.id === selectedId;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(ticket.id);
                    setMobileShowDetail(true);
                  }}
                  className={cn(
                    'flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <span className="line-clamp-2 font-medium text-foreground">
                    {ticket.title}
                  </span>
                  {ticket.requesterName ? (
                    <span className="text-[11px] text-muted-foreground">
                      {ticket.requesterName}
                      {ticket.requesterEmail ? ` · ${ticket.requesterEmail}` : ''}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        supportTicketStatusDotClass(ticket.status)
                      )}
                      aria-hidden
                    />
                    <span>
                      {supportTicketStatusLabel(ticket.status)} ·{' '}
                      {format(new Date(ticket.updatedAt), 'MMM d')}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const detailPanel = (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border/60 px-2 py-2 md:px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileShowDetail(false)}
          aria-label="Back to list"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          {detail ? (
            <>
              <h2 className="truncate text-sm font-semibold leading-tight">
                {detail.title}
              </h2>
              <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      supportTicketStatusDotClass(detail.status)
                    )}
                    aria-hidden
                  />
                  {supportTicketStatusLabel(detail.status)}
                </span>
                <span className="text-muted-foreground/70">·</span>
                <span>
                  {reportBugTabLabel(detail.contextTab)}
                  {detail.contextFeature ? ` · ${detail.contextFeature}` : ''}
                </span>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loadingDetail ? 'Loading…' : 'Select a ticket'}
            </p>
          )}
        </div>
        {detail ? (
          <Select
            value={detail.status}
            onValueChange={(value) => void handleStatus(value)}
            disabled={statusUpdating}
          >
            <SelectTrigger className="h-8 w-[9.5rem] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_VALUES.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                >
                  {supportTicketStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-3">
          {detail ? (
            <>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm leading-relaxed">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Original report
                </p>
                <p className="mt-2 whitespace-pre-wrap text-foreground/90">
                  {detail.body}
                </p>
                {detail.screenshotUrl ? (
                  <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Screenshot
                    </p>
                    <a
                      href={detail.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block max-w-full"
                    >
                      <img
                        src={detail.screenshotUrl}
                        alt="Report screenshot"
                        className="max-h-64 max-w-full rounded-md border border-border/50 object-contain"
                      />
                    </a>
                  </div>
                ) : null}
              </div>
              {detail.requesterName ? (
                <p className="text-xs text-muted-foreground">
                  From {detail.requesterName}
                  {detail.requesterEmail ? ` (${detail.requesterEmail})` : ''}
                </p>
              ) : null}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Thread
                </p>
                {detail.messages.map((message) => {
                  const fromUser = !message.isStaff;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'max-w-[95%] rounded-lg border px-3 py-2 text-sm leading-relaxed',
                        fromUser
                          ? 'ml-auto border-foreground/20 bg-muted'
                          : 'mr-auto border-border/60 bg-muted/30'
                      )}
                    >
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {message.isStaff ? 'Humaner team' : 'You'} ·{' '}
                        {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap">{message.body}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </ScrollArea>

      {detail ? (
        <div className="border-t border-border/60 p-3">
          <div className="flex gap-2">
            <Input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write a reply…"
              className="text-sm"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={sending || !reply.trim()}
              onClick={() => void handleSend()}
            >
              Send
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        'flex h-[min(720px,calc(100vh-8rem))] flex-col rounded-xl border border-border/60 bg-card/30 md:rounded-lg',
        className
      )}
    >
      <div className="flex min-h-0 flex-1 md:hidden">
        {!mobileShowDetail ? (
          list
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{detailPanel}</div>
        )}
      </div>
      <div className="hidden min-h-0 flex-1 md:flex">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-0 flex-1"
        >
          <ResizablePanel
            defaultSize={32}
            minSize={22}
            maxSize={45}
          >
            {list}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={68}
            minSize={40}
          >
            {detailPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
