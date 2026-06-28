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
import {
  listMySupportTickets,
  type MySupportTicketListRow
} from '@/actions/support-tickets/list-my-support-tickets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { reportBugTabLabel } from '@/lib/report-bug-context-options';
import {
  supportTicketStatusDotClass,
  supportTicketStatusLabel
} from '@/lib/support-ticket-labels';
import { cn } from '@/lib/utils';

export type UserSupportTicketsPanelProps = {
  className?: string;
};

export function UserSupportTicketsPanel({
  className
}: UserSupportTicketsPanelProps): React.JSX.Element {
  const [tickets, setTickets] = React.useState<MySupportTicketListRow[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<SupportTicketDetailDto | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [reply, setReply] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [mobileShowDetail, setMobileShowDetail] = React.useState(false);

  const loadTickets = React.useCallback(async () => {
    setLoadingList(true);
    const result = await listMySupportTickets({});
    if (result?.data) {
      setTickets(result.data);
      setSelectedId((previous) => {
        if (previous && result.data!.some((ticket) => ticket.id === previous)) {
          return previous;
        }
        return result.data![0]?.id ?? null;
      });
    }
    setLoadingList(false);
  }, []);

  React.useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

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
    toast.success('Message sent');
    await Promise.all([loadDetail(selectedId), loadTickets()]);
  };

  const list = (
    <div className="flex h-full min-h-0 flex-col md:w-72 md:shrink-0 md:border-r md:border-border/60">
      <div className="border-b border-border/60 px-4 py-3">
        <p className="text-sm font-medium">My tickets</p>
        <p className="text-xs text-muted-foreground">
          Reports you&apos;ve submitted via Help.
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {loadingList ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No tickets yet. Use Help → &quot;Report a bug&quot; to open one.
            </p>
          ) : (
            tickets.map((ticket) => {
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
                    'flex w-full flex-col gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
                    active
                      ? 'border-foreground/20 bg-muted'
                      : 'border-transparent hover:border-border/60 hover:bg-muted/40'
                  )}
                >
                  <span className="line-clamp-2 text-sm font-medium leading-snug">
                    {ticket.title}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="h-5 gap-1.5 px-2 text-[10px] font-medium"
                    >
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          supportTicketStatusDotClass(ticket.status)
                        )}
                        aria-hidden
                      />
                      {supportTicketStatusLabel(ticket.status)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(ticket.updatedAt), 'MMM d')}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const detailPanel = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-3 md:px-4">
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
              <h2 className="truncate text-base font-semibold">{detail.title}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Opened {format(new Date(detail.createdAt), 'MMM d, yyyy')} ·{' '}
                {reportBugTabLabel(detail.contextTab)}
                {detail.contextFeature ? ` · ${detail.contextFeature}` : ''}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loadingDetail
                ? 'Loading…'
                : selectedId
                  ? 'Could not load ticket'
                  : 'Select a ticket to view updates'}
            </p>
          )}
        </div>
        {detail ? (
          <Badge
            variant="outline"
            className="hidden shrink-0 gap-1.5 sm:inline-flex"
          >
            <span
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                supportTicketStatusDotClass(detail.status)
              )}
              aria-hidden
            />
            {supportTicketStatusLabel(detail.status)}
          </Badge>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {detail ? (
            <>
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your report
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {detail.body}
                </p>
                {detail.screenshotUrl ? (
                  <a
                    href={detail.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block max-w-full"
                  >
                    <img
                      src={detail.screenshotUrl}
                      alt="Report screenshot"
                      className="max-h-56 max-w-full rounded-md border border-border/50 object-contain"
                    />
                  </a>
                ) : null}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conversation
                </h3>
                {detail.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No replies yet. We&apos;ll post updates here.
                  </p>
                ) : (
                  detail.messages.map((message) => {
                    const fromUser = !message.isStaff;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'max-w-[95%] rounded-lg border px-3 py-2.5 text-sm leading-relaxed',
                          fromUser
                            ? 'ml-auto border-foreground/20 bg-muted'
                            : 'mr-auto border-border/60 bg-muted/30'
                        )}
                      >
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {message.isStaff ? 'Humaner support' : 'You'} ·{' '}
                          {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap">
                          {message.body}
                        </p>
                      </div>
                    );
                  })
                )}
              </section>
            </>
          ) : null}
        </div>
      </ScrollArea>

      {detail ? (
        <div className="border-t border-border/60 p-3 md:p-4">
          <div className="flex gap-2">
            <Input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Add a message…"
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
        'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-background',
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
      <div className="hidden min-h-0 flex-1 md:flex">{list}{detailPanel}</div>
    </div>
  );
}
