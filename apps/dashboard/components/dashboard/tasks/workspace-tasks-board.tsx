'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { InfoIcon } from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { assignHandoffTicket } from '@/actions/handoff/assign-handoff-ticket';
import { updateHandoffTicketStatus } from '@/actions/handoff/update-handoff-ticket-status';
import { createWorkspaceTask } from '@/actions/tasks/create-workspace-task';
import { deleteWorkspaceTask } from '@/actions/tasks/delete-workspace-task';
import { AssigneePicker } from '@/components/dashboard/assignee-options';
import { ticketStatusToGlyph } from '@/components/dashboard/desk/desk-ticket-preview-row';
import {
  QUICK_CREATE_BODY_CLASS,
  QUICK_CREATE_TITLE_CLASS,
  QuickCreateDialogContent,
  QuickCreateFooter
} from '@/components/dashboard/quick-create-dialog';
import { DueDateChip } from '@/components/dashboard/tasks/due-date-chip';
import { WorkspacePageShell } from '@/components/dashboard/workspace-page-shell';
import { Button } from '@/components/ui/button';
import { DeleteIconActionButton } from '@/components/ui/delete-action-button';
import { Dialog } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { StatusGlyph } from '@/components/ui/status-glyph';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import type {
  HandoffTeamMember,
  HandoffTicketItem
} from '@/data/handoff/get-handoff-tickets';
import { formatTicketRef } from '@/lib/desk/ticket-ref';
import { formatDueLabel, isDueOverdue } from '@/lib/tasks/due-date';
import { cn } from '@/lib/utils';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';
import { HandoffTicketStatus } from '@/types/handoff-ticket';

const COLUMNS = [
  {
    id: 'OPEN',
    label: 'Open',
    status: HandoffTicketStatus.OPEN,
    glyph: 'open' as const
  },
  {
    id: 'IN_PROGRESS',
    label: 'In progress',
    status: HandoffTicketStatus.IN_PROGRESS,
    glyph: 'progress' as const
  },
  {
    id: 'RESOLVED',
    label: 'Done',
    status: HandoffTicketStatus.RESOLVED,
    glyph: 'resolved' as const
  }
] as const;

const STATUS_OPTIONS = COLUMNS.map((column) => ({
  value: column.status,
  label: column.label
}));

const DAY_LABELS: Record<string, string> = {
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat'
};

const JS_DAY_TO_ENUM = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
] as const;

function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatWorkingHours(hours: WorkHoursDto[]): string {
  const today = JS_DAY_TO_ENUM[new Date().getDay()];
  const row = hours.find((item) => item.dayOfWeek === today);
  const slots = row?.timeSlots ?? [];
  if (slots.length === 0) {
    return 'No working hours set for today';
  }
  return `${DAY_LABELS[today] ?? today} ${slots
    .map((slot) => `${formatClock(slot.start)}–${formatClock(slot.end)}`)
    .join(', ')}`;
}

export function WorkspaceTasksBoard({
  tickets,
  teamMembers,
  currentUserId,
  businessHours
}: {
  tickets: HandoffTicketItem[];
  teamMembers: HandoffTeamMember[];
  currentUserId: string;
  businessHours: WorkHoursDto[];
}): React.JSX.Element {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [assigneeId, setAssigneeId] = React.useState<string>(currentUserId);
  const [dueAt, setDueAt] = React.useState<Date | null>(null);

  const resetCreate = (): void => {
    setSubject('');
    setSummary('');
    setAssigneeId(currentUserId);
    setDueAt(null);
  };

  const { execute: createTask, isExecuting: isCreating } = useAction(
    createWorkspaceTask,
    {
      onSuccess: () => {
        resetCreate();
        setCreateOpen(false);
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Couldn't create the task");
      }
    }
  );

  const { execute: updateStatus } = useAction(updateHandoffTicketStatus, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Couldn't update the task");
    }
  });

  const { execute: assignTask } = useAction(assignHandoffTicket, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Couldn't assign the task");
    }
  });

  const { execute: deleteTask, isExecuting: isDeleting } = useAction(
    deleteWorkspaceTask,
    {
      onSuccess: () => router.refresh(),
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Couldn't delete the task");
      }
    }
  );

  const grouped = {
    OPEN: tickets.filter((ticket) => ticket.status === 'OPEN'),
    IN_PROGRESS: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS'),
    RESOLVED: tickets.filter(
      (ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
    )
  };

  return (
    <>
      <WorkspacePageShell
        title="Tasks"
        description={
          <>
            Create team, support, or reply work and assign it against working
            hours.{' '}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex align-text-bottom text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Working hours for today"
                >
                  <InfoIcon className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs text-xs leading-relaxed"
              >
                {formatWorkingHours(businessHours)}
              </TooltipContent>
            </Tooltip>
          </>
        }
        actions={
          <Button
            type="button"
            size="sm"
            className="h-9 px-3 font-mono text-xs font-medium normal-case tracking-normal"
            onClick={() => setCreateOpen(true)}
          >
            Create task
          </Button>
        }
      >
        <div className="grid min-h-full gap-4 lg:grid-cols-3">
          {COLUMNS.map((column) => (
            <section
              key={column.id}
              className="flex min-h-72 flex-col overflow-hidden rounded-[12px] border border-border/60"
            >
              <header className="flex items-center justify-between border-b border-border/50 px-3 py-2">
                <h2 className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <StatusGlyph kind={column.glyph} />
                  {column.label}
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {grouped[column.id].length}
                </span>
              </header>
              <ul className="flex flex-1 flex-col gap-2 p-2">
                {grouped[column.id].map((ticket) => (
                  <li
                    key={ticket.id}
                    className="rounded-[12px] border border-border/50 bg-background px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {formatTicketRef(ticket.ticketNumber)}
                      </p>
                      <DeleteIconActionButton
                        srLabel="Delete task"
                        className="-mr-1.5 -mt-1 size-7"
                        disabled={isDeleting}
                        onClick={() => deleteTask({ id: ticket.id })}
                      />
                    </div>
                    <p className="mt-1 text-sm leading-snug">
                      {ticket.subject}
                    </p>
                    {ticket.dueAt ? (
                      <p
                        className={cn(
                          'mt-1 font-mono text-[10px]',
                          isDueOverdue(ticket.dueAt)
                            ? 'text-[#f85919]'
                            : 'text-muted-foreground'
                        )}
                      >
                        Due {formatDueLabel(ticket.dueAt)}
                      </p>
                    ) : null}
                    {ticket.summary && ticket.summary !== ticket.subject ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {ticket.summary}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <AssigneePicker
                        members={teamMembers}
                        value={ticket.assignee?.id ?? null}
                        currentUserId={currentUserId}
                        compact
                        align="start"
                        className="min-w-0 flex-1"
                        onChange={(next) =>
                          assignTask({
                            id: ticket.id,
                            assigneeId: next
                          })
                        }
                      />
                      <Select
                        value={
                          ticket.status === 'CLOSED'
                            ? HandoffTicketStatus.RESOLVED
                            : ticket.status
                        }
                        onValueChange={(next) =>
                          updateStatus({
                            id: ticket.id,
                            status:
                              next as (typeof HandoffTicketStatus)[keyof typeof HandoffTicketStatus]
                          })
                        }
                      >
                        <SelectTrigger className="h-7 min-h-7 w-40 shrink-0 items-center gap-1.5 rounded-lg py-0 text-xs leading-none [&>span]:flex [&>span]:h-full [&>span]:items-center [&>span]:gap-1.5 [&>span]:whitespace-nowrap [&>span]:leading-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              textValue={option.label}
                              className="items-center py-1.5 text-xs leading-none"
                            >
                              <span className="inline-flex h-4 items-center gap-1.5 whitespace-nowrap leading-none">
                                <StatusGlyph
                                  kind={ticketStatusToGlyph(option.value)}
                                />
                                <span className="leading-none">
                                  {option.label}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </WorkspacePageShell>
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreate();
        }}
      >
        <QuickCreateDialogContent
          title="New task"
          description="Create a workspace task and assign it."
          className="sm:max-w-lg"
        >
          <form
            className="flex flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              createTask({
                subject,
                summary,
                assigneeId: assigneeId || null,
                dueAt: dueAt ?? null
              });
            }}
          >
            <div className="flex flex-col gap-1 px-5 pt-4">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Task title"
                required
                className={`${QUICK_CREATE_TITLE_CLASS} py-1`}
              />
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Add a note or linked thread…"
                rows={2}
                className={`${QUICK_CREATE_BODY_CLASS} min-h-[3.25rem]`}
              />
            </div>
            <QuickCreateFooter className="justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <AssigneePicker
                  members={teamMembers}
                  value={assigneeId || null}
                  currentUserId={currentUserId}
                  onChange={(next) => setAssigneeId(next ?? '')}
                  compact
                  align="start"
                  contentClassName="z-[60] min-w-56 border-border bg-popover shadow-lg"
                />
                <DueDateChip
                  value={dueAt}
                  onChange={setDueAt}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-8 px-3 font-mono text-xs font-medium normal-case tracking-normal"
                disabled={isCreating || !subject.trim()}
              >
                {isCreating ? 'Creating…' : 'Create task'}
              </Button>
            </QuickCreateFooter>
          </form>
        </QuickCreateDialogContent>
      </Dialog>
    </>
  );
}
