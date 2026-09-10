'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  CreditCardIcon,
  GitCompareIcon,
  KeyRoundIcon,
  MailIcon,
  Trash2Icon
} from '@humaner/shared/icons';
import { format } from 'date-fns';

import { TicketIcon } from '@/components/ui/ticket-icon';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import {
  groupDashboardNotifications,
  notificationGroupSummary,
  type NotificationGroup
} from '@/lib/notifications/notification-groups';
import { cn } from '@/lib/utils';
import type {
  DashboardNotification,
  DashboardNotificationKind
} from '@/types/dashboard-notification';

function formatEmphasis(value: string): string {
  const normalized = value.trim();
  if (
    normalized.startsWith('#') ||
    normalized === 'high' ||
    normalized === 'medium' ||
    normalized === 'low'
  ) {
    return `[${normalized}]`;
  }
  return normalized;
}

export type GroupedNotificationsProps = {
  notifications: DashboardNotification[];
  onNavigate: () => void;
  onDismiss?: (id: string) => void;
  headerAction?: React.ReactNode;
};

const SECTION_SURFACE: Record<DashboardNotificationKind, string> = {
  ticket: 'bg-muted/50',
  task: 'bg-success/[0.07] dark:bg-success/[0.08]',
  mail: 'bg-sky-500/[0.07] dark:bg-sky-400/[0.08]',
  api_key: 'bg-warning/[0.08] dark:bg-warning/[0.09]',
  loop: 'bg-violet-500/[0.07] dark:bg-violet-400/[0.08]',
  billing: 'bg-orange-500/[0.07] dark:bg-orange-400/[0.08]'
};

export function GroupedNotifications({
  notifications,
  onNavigate,
  onDismiss,
  headerAction
}: GroupedNotificationsProps): React.JSX.Element {
  const grouped = React.useMemo(
    () => groupDashboardNotifications(notifications),
    [notifications]
  );
  const today = format(new Date(), 'MMMM d, yyyy');
  const weekday = format(new Date(), 'EEEE');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <p className="font-fellix text-[15px] leading-none tracking-tight">
          <span className="text-foreground">{weekday}</span>{' '}
          <span className="font-info text-muted-foreground">{today}</span>
        </p>
        {headerAction}
      </div>

      {grouped.map((section) => (
        <NotificationSection
          key={section.kind}
          group={section}
          onNavigate={onNavigate}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function NotificationSection({
  group,
  onNavigate,
  onDismiss
}: {
  group: NotificationGroup;
  onNavigate: () => void;
  onDismiss?: (id: string) => void;
}): React.JSX.Element {
  const { countLabel, context } = notificationGroupSummary(group);

  return (
    <section
      className={cn(
        'border border-border/60 px-3 py-3',
        dashboardRadiusClassName,
        SECTION_SURFACE[group.kind]
      )}
    >
      <p className="text-[13px] leading-5 text-muted-foreground">
        You have{' '}
        <span className="font-medium text-foreground">{countLabel}</span>
        {context ? ` ${context}` : ''}
      </p>
      <ul className="mt-2">
        {group.items.map((item) => (
          <li key={item.id}>
            <NotificationLine
              item={item}
              onNavigate={onNavigate}
              onDismiss={onDismiss}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotificationLine({
  item,
  onNavigate,
  onDismiss
}: {
  item: DashboardNotification;
  onNavigate: () => void;
  onDismiss?: (id: string) => void;
}): React.JSX.Element {
  const [checked, setChecked] = React.useState(false);
  const label = [item.title, item.emphasis].filter(Boolean).join(' ');

  const completeTask = (): void => {
    if (checked) return;
    setChecked(true);
    window.setTimeout(() => onDismiss?.(item.id), 220);
  };

  const text = (
    <span
      className={cn(
        'min-w-0 truncate transition-colors',
        checked && 'text-muted-foreground/60 line-through'
      )}
    >
      <span>{item.title}</span>
      {item.emphasis ? (
        <>
          {item.title ? ' ' : null}
          <span
            className={cn(
              'font-info',
              checked ? 'text-muted-foreground/70' : 'text-foreground'
            )}
          >
            {formatEmphasis(item.emphasis)}
          </span>
        </>
      ) : null}
    </span>
  );

  return (
    <div
      className={cn(
        'group/item relative flex items-center gap-2.5 px-1.5 py-1.5 text-[13px] leading-5 text-muted-foreground transition-colors',
        'hover:bg-background/55 hover:text-foreground',
        dashboardRadiusClassName
      )}
    >
      {item.kind === 'task' ? (
        <button
          type="button"
          className={cn(
            'flex size-3.5 shrink-0 items-center justify-center border border-muted-foreground/50 transition-colors',
            dashboardRadiusClassName,
            checked
              ? 'border-foreground bg-foreground text-background'
              : 'hover:border-foreground'
          )}
          aria-label={checked ? 'Task completed' : 'Mark task done'}
          aria-pressed={checked}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            completeTask();
          }}
        >
          {checked ? <CheckIcon className="size-2.5" /> : null}
        </button>
      ) : (
        <GroupGlyph kind={item.kind} />
      )}

      <Link
        href={item.href}
        className="min-w-0 flex-1 truncate"
        aria-label={label}
        onClick={onNavigate}
      >
        {text}
      </Link>

      {onDismiss ? (
        <button
          type="button"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-all',
            'opacity-0 group-hover/item:opacity-100 hover:text-destructive',
            'focus-visible:opacity-100'
          )}
          aria-label={`Remove ${label}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDismiss(item.id);
          }}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function GroupGlyph({
  kind
}: {
  kind: Exclude<DashboardNotificationKind, 'task'>;
}): React.JSX.Element {
  if (kind === 'ticket') {
    return (
      <TicketIcon
        size={14}
        className="shrink-0 text-muted-foreground"
        aria-hidden
      />
    );
  }

  if (kind === 'loop') {
    return (
      <GitCompareIcon
        className="size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    );
  }

  const Icon = GROUP_ICONS[kind];
  return (
    <Icon
      className="size-3.5 shrink-0 text-muted-foreground"
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

const GROUP_ICONS: Record<
  Exclude<DashboardNotificationKind, 'task' | 'ticket' | 'loop'>,
  typeof MailIcon
> = {
  mail: MailIcon,
  api_key: KeyRoundIcon,
  billing: CreditCardIcon
};
