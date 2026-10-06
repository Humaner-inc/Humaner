'use client';

import * as React from 'react';

import { WorkspaceSettingsIntro } from '@/components/dashboard/inbox/workspace-settings-intro';
import { SettingsTabBar } from '@/components/dashboard/settings/settings-tab-bar';
import {
  workspaceSettingsHref,
  type WorkspaceSettingsTab
} from '@/constants/workspace-settings-tabs';
import { isOssDeployment } from '@/lib/deployment-mode';

const TABS: Array<{
  id: WorkspaceSettingsTab;
  label: string;
  page: '1' | '2' | '3' | '4';
}> = [
  { id: 'inbox', label: 'Inbox', page: '1' },
  { id: 'companion', label: 'Companion', page: '2' },
  { id: 'connect', label: 'Connect', page: '3' },
  { id: 'data', label: 'Data', page: '4' }
];

export function InboxSettingsShell({
  initialTab,
  inbox,
  companion,
  connect,
  data,
  intros
}: {
  initialTab: WorkspaceSettingsTab;
  inbox: React.ReactNode;
  companion: React.ReactNode;
  connect: React.ReactNode;
  data: React.ReactNode;
  intros: Record<WorkspaceSettingsTab, string>;
}): React.JSX.Element {
  const tabs = isOssDeployment()
    ? TABS.filter((item) => item.id === 'inbox')
    : TABS;
  const [tab, setTab] = React.useState<WorkspaceSettingsTab>(
    isOssDeployment() ? 'inbox' : initialTab
  );
  const page = tabs.find((item) => item.id === tab)?.page ?? '1';

  const selectTab = React.useCallback((next: WorkspaceSettingsTab) => {
    setTab(next);
    window.history.replaceState(
      window.history.state,
      '',
      workspaceSettingsHref(next)
    );
  }, []);

  return (
    <div className="space-y-6">
      <SettingsTabBar
        ariaLabel="Workspace settings"
        tabs={tabs.map((item) => ({
          id: item.id,
          label: item.label,
          active: item.id === tab,
          onSelect: () => selectTab(item.id)
        }))}
      />
      <WorkspaceSettingsIntro text={intros[tab]} />
      <div
        className="t-page-slide"
        data-page={page}
      >
        <section
          className="t-page"
          data-page-id="1"
        >
          {inbox}
        </section>
        <section
          className="t-page"
          data-page-id="2"
        >
          {companion}
        </section>
        <section
          className="t-page"
          data-page-id="3"
        >
          {connect}
        </section>
        <section
          className="t-page"
          data-page-id="4"
        >
          {data}
        </section>
      </div>
    </div>
  );
}
