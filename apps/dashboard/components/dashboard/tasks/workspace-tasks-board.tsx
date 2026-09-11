'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { assignHandoffTicket } from '@/actions/handoff/assign-handoff-ticket';
import { updateHandoffTicketStatus } from '@/actions/handoff/update-handoff-ticket-status';
import { createWorkspaceTask } from '@/actions/tasks/create-workspace-task';
import { AssigneePicker } from '@/components/dashboard/assignee-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  HandoffTeamMember,
  HandoffTicketItem
} from '@/data/handoff/get-handoff-tickets';
import { formatTicketRef } from '@/lib/desk/ticket-ref';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';
import { HandoffTicketStatus } from '@/types/handoff-ticket';

const COLUMNS = [
  { id: 'OPEN', label: 'Open', status: HandoffTicketStatus.OPEN },
  {
    id: 'IN_PROGRESS',
    label: 'In progress',
    status: HandoffTicketStatus.IN_PROGRESS
  },
  { id: 'RESOLVED', label: 'Done', status: HandoffTicketStatus.RESOLVED }
] as const;

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
  const [subject, setSubject] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [assigneeId, setAssigneeId] = React.useState<string>(currentUserId);

  const { execute: createTask, isExecuting: isCreating } = useAction(
    createWorkspaceTask,
    {
      onSuccess: () => {
        setSubject('');
        setSummary('');
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

  const grouped = {
    OPEN: tickets.filter((ticket) => ticket.status === 'OPEN'),
    IN_PROGRESS: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS'),
    RESOLVED: tickets.filter(
      (ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
    )
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/50 px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Create team, support, or reply work and assign it against working
              hours.
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {formatWorkingHours(businessHours)}
            </p>
          </div>
        </div>

        <form
          className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            createTask({
              subject,
              summary,
              assigneeId: assigneeId || null
            });
          }}
        >
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Task title"
            required
          />
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Associated thread or note"
          />
          <AssigneePicker
            members={teamMembers}
            value={assigneeId || null}
            currentUserId={currentUserId}
            onChange={(next) => setAssigneeId(next ?? '')}
            align="start"
            className="h-10"
          />
          <Button
            type="submit"
            disabled={isCreating || !subject.trim()}
            className="rounded-lg"
          >
            Create task
          </Button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div className="grid min-h-full gap-4 lg:grid-cols-3">
          {COLUMNS.map((column) => (
            <section
              key={column.id}
              className="flex min-h-72 flex-col border border-border/60"
            >
              <header className="flex items-center justify-between border-b border-border/50 px-3 py-2">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
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
                    className="border border-border/50 bg-background px-3 py-2.5"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {formatTicketRef(ticket.ticketNumber)}
                    </p>
                    <p className="mt-1 text-sm leading-snug">
                      {ticket.subject}
                    </p>
                    {ticket.summary && ticket.summary !== ticket.subject ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {ticket.summary}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
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
                      <select
                        value={
                          ticket.status === 'CLOSED'
                            ? HandoffTicketStatus.RESOLVED
                            : ticket.status
                        }
                        onChange={(event) =>
                          updateStatus({
                            id: ticket.id,
                            status: event.target
                              .value as (typeof HandoffTicketStatus)[keyof typeof HandoffTicketStatus]
                          })
                        }
                        className="h-8 border border-input bg-transparent px-2 text-xs outline-none"
                      >
                        <option value={HandoffTicketStatus.OPEN}>Open</option>
                        <option value={HandoffTicketStatus.IN_PROGRESS}>
                          In progress
                        </option>
                        <option value={HandoffTicketStatus.RESOLVED}>
                          Done
                        </option>
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
