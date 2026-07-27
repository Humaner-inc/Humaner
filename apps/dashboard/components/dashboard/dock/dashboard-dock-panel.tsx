'use client';

import * as React from 'react';
import {
  ArrowLeftIcon,
  InfoIcon,
  MailIcon,
  MessageCircleIcon,
  TriangleAlertIcon,
  XIcon
} from '@humaner/shared/icons';

import { AskHumanerPanel } from '@/components/dashboard/ask-humaner/ask-humaner-panel';
import {
  useDashboardDock,
  type DockMode
} from '@/components/dashboard/dock/dashboard-dock-context';
import { DockFeedbackForm } from '@/components/dashboard/dock/dock-feedback-form';
import { DockNotificationsView } from '@/components/dashboard/dock/dock-notifications-view';
import { DockReportBugForm } from '@/components/dashboard/dock/dock-report-bug-form';
import { Button } from '@/components/ui/button';
import { getSupportMailtoUrl } from '@/lib/urls/get-support-email';
import { cn } from '@/lib/utils';

const DOCK_TITLES: Record<NonNullable<DockMode>, string> = {
  ask: '/ask humaner',
  help: 'Need help?',
  notifications: 'Notifications',
  'report-bug': 'Report a bug',
  feedback: 'Feedback'
};

const BACK_MODES: Partial<
  Record<NonNullable<DockMode>, NonNullable<DockMode>>
> = {
  'report-bug': 'help',
  feedback: 'help'
};

export function DashboardDockPanel(): React.JSX.Element {
  const { activeMode, closeDock, openDock } = useDashboardDock();
  const isOpen = activeMode !== null;

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden border-l border-border/50 transition-[width] duration-300 ease-out',
        isOpen
          ? 'w-96 max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 max-lg:w-full max-lg:border-l-0'
          : 'w-0 border-l-0'
      )}
    >
      {activeMode ? (
        <div className="flex h-full w-96 max-lg:w-full flex-col bg-background">
          {activeMode !== 'ask' ? (
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4">
              {BACK_MODES[activeMode] ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => openDock(BACK_MODES[activeMode]!)}
                  aria-label="Back"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
              ) : null}
              <span className="flex-1 truncate font-mono text-xs tracking-tight">
                {DOCK_TITLES[activeMode]}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={closeDock}
                aria-label="Close panel"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            <DockContent mode={activeMode} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DockContent({
  mode
}: {
  mode: NonNullable<DockMode>;
}): React.JSX.Element {
  const { closeDock } = useDashboardDock();

  switch (mode) {
    case 'ask':
      return (
        <AskHumanerPanel
          onClose={closeDock}
          className="h-full"
        />
      );
    case 'help':
      return <DockHelpView />;
    case 'notifications':
      return <DockNotificationsView />;
    case 'report-bug':
      return <DockReportBugForm />;
    case 'feedback':
      return <DockFeedbackForm />;
  }
}

function DockHelpView(): React.JSX.Element {
  const { openDock } = useDashboardDock();

  return (
    <div className="p-4 space-y-2">
      <p className="mb-4 text-xs text-muted-foreground">
        Reach the team, report a bug or give feedback.
        <br />
        Human team only behind the scenes.
      </p>
      <HelpItem
        icon={MailIcon}
        label="Send an email"
        description="Open your mail client"
        onClick={() => {
          window.location.href = getSupportMailtoUrl('Humaner support');
        }}
      />
      <HelpItem
        icon={TriangleAlertIcon}
        label="Report a bug"
        description="Open a support ticket"
        onClick={() => openDock('report-bug')}
      />
      <HelpItem
        icon={MessageCircleIcon}
        label="Give feedback"
        description="Share ideas or questions"
        onClick={() => openDock('feedback')}
      />
    </div>
  );
}

function HelpItem({
  icon: Icon,
  label,
  description,
  onClick
}: {
  icon: typeof InfoIcon;
  label: string;
  description: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border border-border/60 px-4 py-3 text-left transition-colors',
        'hover:bg-muted/50'
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-foreground/80" />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
