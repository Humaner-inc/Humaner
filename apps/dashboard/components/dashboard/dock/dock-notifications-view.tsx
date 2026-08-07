'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import NiceModal from '@ebay/nice-modal-react';
import {
  AlertCircleIcon,
  BellIcon,
  CreditCardIcon,
  HeadsetIcon,
  Layers,
  Trash2Icon,
  TriangleAlertIcon
} from '@humaner/shared/icons';
import { formatDistanceToNow } from 'date-fns';

import { FeatureIntroEmpty } from '@/components/dashboard/desk/feature-intro-empty';
import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { useDockNotifications } from '@/components/dashboard/dock/dock-notifications-context';
import { HumanDeskNotificationItem } from '@/components/dashboard/notifications/human-desk-notification-item';
import { UserTicketsSheet } from '@/components/support/user-tickets-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppInfo } from '@/constants/app-info';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';
import type {
  DashboardNotification,
  DashboardNotificationKind
} from '@/types/dashboard-notification';

const oss = isOssDeployment();

const KIND_SECTIONS: {
  kind: DashboardNotificationKind;
  label: string;
}[] = oss
  ? [
      { kind: 'human_desk', label: AppInfo.HELPDESK_LABEL },
      { kind: 'history_highlight', label: 'Conversation highlights' }
    ]
  : [
      { kind: 'billing', label: 'Billing' },
      { kind: 'plan_limit', label: 'Plan limits' },
      { kind: 'human_desk', label: 'Human Desk' },
      { kind: 'workspace_ticket', label: 'Your tickets' },
      { kind: 'history_highlight', label: 'Conversation highlights' }
    ];

const KIND_ORDER = Object.fromEntries(
  KIND_SECTIONS.map((section, index) => [section.kind, index])
) as Record<DashboardNotificationKind, number>;

export function DockNotificationsView(): React.JSX.Element {
  const {
    visibleNotifications,
    markSeen,
    dismissAll,
    teamMembers,
    currentUserId
  } = useDockNotifications();
  const { closeDock } = useDashboardDock();

  React.useEffect(() => {
    markSeen();
  }, [markSeen]);

  const grouped = React.useMemo(() => {
    const sorted = [...visibleNotifications].sort((a, b) => {
      const kindDiff = (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99);
      if (kindDiff !== 0) return kindDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return KIND_SECTIONS.map((section) => ({
      ...section,
      items: sorted.filter((item) => item.kind === section.kind)
    })).filter((section) => section.items.length > 0);
  }, [visibleNotifications]);

  return (
    <div className="h-full overflow-y-auto p-4">
      {grouped.length === 0 ? (
        <FeatureIntroEmpty
          compact
          icon={<BellIcon strokeWidth={1.25} />}
          title="You're all caught up"
          description="Nothing needs your attention right now."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((section, index) => (
            <section key={section.kind}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-fellix text-sm text-foreground">
                  {section.label}
                </h3>
                {index === 0 && dismissAll ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:bg-muted/60 hover:text-destructive"
                    aria-label="Clear all notifications"
                    onClick={dismissAll}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                ) : null}
              </div>
              <div className="space-y-2">
                {section.items.map((item) =>
                  item.kind === 'human_desk' ? (
                    <HumanDeskNotificationItem
                      key={item.id}
                      item={item}
                      teamMembers={teamMembers}
                      currentUserId={currentUserId}
                      onNavigate={closeDock}
                    />
                  ) : (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onNavigate={closeDock}
                    />
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  item,
  onNavigate
}: {
  item: DashboardNotification;
  onNavigate: () => void;
}): React.JSX.Element {
  const Icon = getNotificationIcon(item);
  const relativeTime = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true
  });

  const isHumanerHighlight =
    item.kind === 'history_highlight' && item.severity === 'success';

  const content = (
    <>
      {isHumanerHighlight ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Image
            src="/favicon.svg"
            alt=""
            width={16}
            height={16}
            unoptimized
            className="size-4"
          />
        </span>
      ) : (
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            severityIconClass(item.severity)
          )}
        >
          <Icon className="size-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'block text-sm leading-snug',
              isHumanerHighlight ? 'font-fellix text-foreground' : 'font-medium'
            )}
          >
            {item.title}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {relativeTime}
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {item.description}
        </span>
        {item.tag ? (
          isHumanerHighlight ? (
            <span className="mt-2 block font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {item.tag}
            </span>
          ) : (
            <Badge
              variant="secondary"
              className="mt-2 h-5 px-1.5 text-[10px] font-normal"
            >
              {item.tag}
            </Badge>
          )
        ) : null}
      </span>
    </>
  );

  const className = cn(
    'flex w-full items-start gap-3 border border-border/60 px-4 py-3 text-left transition-colors',
    dashboardRadiusClassName,
    'hover:bg-muted/50'
  );

  if (item.action === 'open_support_tickets') {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          onNavigate();
          NiceModal.show(UserTicketsSheet);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}

function getNotificationIcon(item: DashboardNotification): typeof BellIcon {
  switch (item.kind) {
    case 'plan_limit':
      return Layers;
    case 'human_desk':
      return HeadsetIcon;
    case 'workspace_ticket':
      return TriangleAlertIcon;
    case 'billing':
      return CreditCardIcon;
    case 'history_highlight':
      return AlertCircleIcon;
    default:
      return BellIcon;
  }
}

function severityIconClass(
  severity: DashboardNotification['severity']
): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
    case 'warning':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
    case 'success':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
    default:
      return 'bg-muted text-foreground/80';
  }
}
