'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { ticketStatusToGlyph } from '@/components/dashboard/desk/desk-ticket-preview-row';
import { WorkspacePageShell } from '@/components/dashboard/workspace-page-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusGlyph } from '@/components/ui/status-glyph';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import type { MailThreadListItem } from '@/data/inbox/get-mail-threads';
import type { AssignedTaskItem } from '@/data/tasks/get-assigned-tasks';
import { companyDomainFromEmail } from '@/lib/contacts/contact-email';
import { getLogoUrl } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

const DEFAULT_UNREAD = '#001afc';

type AssignedFilter = 'all' | 'mail' | 'tasks';

const FILTERS: Array<{ id: AssignedFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'mail', label: 'Mail' },
  { id: 'tasks', label: 'Tasks' }
];

function senderDomain(email: string | null): string | null {
  if (!email) return null;
  return companyDomainFromEmail(email);
}

function senderLabel(thread: MailThreadListItem): string {
  return thread.fromName || thread.fromAddress || thread.aliasAddress;
}

function ReadCircle({
  unread,
  color
}: {
  unread: boolean;
  color: string;
}): React.JSX.Element {
  return (
    <span
      className="mt-2 size-2.5 shrink-0 rounded-full"
      style={
        unread
          ? { backgroundColor: color }
          : {
              boxShadow: `inset 0 0 0 1.5px ${color}`,
              backgroundColor: 'transparent'
            }
      }
      aria-hidden
    />
  );
}

export function AssignedWorkList({
  threads,
  tasks
}: {
  threads: MailThreadListItem[];
  tasks: AssignedTaskItem[];
}): React.JSX.Element {
  const [filter, setFilter] = React.useState<AssignedFilter>('all');

  const items = React.useMemo(() => {
    const mailItems = threads.map((thread) => ({
      kind: 'mail' as const,
      id: `mail-${thread.id}`,
      at: new Date(thread.lastMessageAt).getTime(),
      thread
    }));
    const taskItems = tasks.map((task) => ({
      kind: 'task' as const,
      id: `task-${task.id}`,
      at: new Date(task.updatedAt).getTime(),
      task
    }));

    const next =
      filter === 'mail'
        ? mailItems
        : filter === 'tasks'
          ? taskItems
          : [...mailItems, ...taskItems];

    return next.toSorted((left, right) => right.at - left.at);
  }, [filter, tasks, threads]);

  return (
    <WorkspacePageShell
      title="Assigned"
      toolbar={
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-[14px] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                filter === item.id
                  ? 'border-[#0A0D0D]/30 bg-transparent text-foreground dark:border-white/25'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {item.id === 'mail' ? (
                <span className="size-1.5 rounded-full bg-[#001afc]" />
              ) : null}
              {item.id === 'tasks' ? (
                <span className="size-1.5 rounded-full bg-[#e6b325]" />
              ) : null}
              {item.label}
            </button>
          ))}
        </div>
      }
    >
      <ul className="overflow-hidden rounded-[12px] border border-border/60">
        {items.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            {filter === 'mail'
              ? 'No mail assigned to you.'
              : filter === 'tasks'
                ? 'No tasks assigned to you.'
                : 'Nothing assigned to you yet.'}
          </li>
        ) : (
          items.map((item) =>
            item.kind === 'mail' ? (
              <AssignedMailRow
                key={item.id}
                thread={item.thread}
              />
            ) : (
              <AssignedTaskRow
                key={item.id}
                task={item.task}
              />
            )
          )
        )}
      </ul>
    </WorkspacePageShell>
  );
}

function AssignedMailRow({
  thread
}: {
  thread: MailThreadListItem;
}): React.JSX.Element {
  const domain = senderDomain(thread.fromAddress);
  const label = senderLabel(thread);
  const unread = thread.isUnread && thread.awaitingReply;
  const circleColor = thread.tag?.color ?? DEFAULT_UNREAD;

  return (
    <li
      className={cn(
        'border-b border-border last:border-b-0',
        unread && 'bg-[color-mix(in_srgb,#001afc_8%,transparent)]'
      )}
    >
      <Link
        href={inboxThreadRoute(thread.id)}
        className="flex items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-foreground/[0.04]"
      >
        <Avatar className="mt-0.5 size-7 shrink-0 rounded-[12px]">
          {domain ? (
            <AvatarImage
              src={getLogoUrl(domain, 64)}
              alt=""
            />
          ) : null}
          <AvatarFallback className="rounded-[12px] text-[10px] font-medium">
            {getInitials(label)}
          </AvatarFallback>
        </Avatar>
        <ReadCircle
          unread={unread}
          color={circleColor}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'min-w-0 truncate text-[13px] leading-5',
                unread ? 'font-semibold text-foreground' : 'text-foreground'
              )}
            >
              {label}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Mail
            </span>
          </span>
          <span
            className={cn(
              'mt-0.5 block truncate text-[12px] leading-4',
              unread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {thread.subject || '(no subject)'}
          </span>
          <span className="mt-0.5 block truncate text-[11px] leading-4 text-muted-foreground">
            {thread.preview ?? 'No preview'}
          </span>
        </span>
      </Link>
    </li>
  );
}

function AssignedTaskRow({
  task
}: {
  task: AssignedTaskItem;
}): React.JSX.Element {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={Routes.Tasks}
        className="flex items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-foreground/[0.04]"
      >
        <span className="mt-1 shrink-0">
          <StatusGlyph kind={ticketStatusToGlyph(task.status)} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[13px] leading-5 text-foreground">
              {task.subject}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Task
            </span>
          </span>
          {task.summary && task.summary !== task.subject ? (
            <span className="mt-0.5 block truncate text-[11px] leading-4 text-muted-foreground">
              {task.summary}
            </span>
          ) : (
            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
              Updated{' '}
              {formatDistanceToNow(new Date(task.updatedAt), {
                addSuffix: true
              })}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
