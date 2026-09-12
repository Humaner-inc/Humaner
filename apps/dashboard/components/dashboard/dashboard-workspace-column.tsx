'use client';

import * as React from 'react';

import { CompanionComposer } from '@/components/dashboard/ask-humaner/companion-composer';
import { useHumanerChatOptional } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { PageAccessGate } from '@/components/dashboard/page-access-gate';
import {
  COMPANION_DOCK_OFFSET,
  COMPANION_DOCK_OFFSET_VAR,
  COMPANION_DOCK_OFFSET_WITH_PANEL,
  COMPANION_WORKSPACE_OFFSET_CLASS,
  COMPANION_WORKSPACE_OFFSET_WITH_PANEL_CLASS
} from '@/lib/companion-visibility';
import { cn } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export function DashboardWorkspaceColumn({
  profile,
  children
}: {
  profile: ProfileDto;
  children: React.ReactNode;
}): React.JSX.Element {
  const chat = useHumanerChatOptional();
  const companionVisible = chat?.companionVisible ?? false;
  const [composerMounted, setComposerMounted] =
    React.useState(companionVisible);
  const taskPanelOpen = chat?.taskPanelOpen ?? false;

  React.useEffect(() => {
    if (companionVisible) {
      setComposerMounted(true);
    }
  }, [companionVisible]);

  const dockOffset = !composerMounted
    ? '0px'
    : companionVisible && taskPanelOpen
      ? COMPANION_DOCK_OFFSET_WITH_PANEL
      : COMPANION_DOCK_OFFSET;

  return (
    <div
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden"
      style={
        {
          [COMPANION_DOCK_OFFSET_VAR]: dockOffset
        } as React.CSSProperties
      }
    >
      <PageAccessGate profile={profile}>
        <div
          className={cn(
            'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
            composerMounted &&
              (companionVisible && taskPanelOpen
                ? COMPANION_WORKSPACE_OFFSET_WITH_PANEL_CLASS
                : COMPANION_WORKSPACE_OFFSET_CLASS)
          )}
        >
          {children}
        </div>
      </PageAccessGate>
      {composerMounted ? (
        <CompanionComposer
          departing={!companionVisible}
          onDeparted={() => setComposerMounted(false)}
        />
      ) : null}
    </div>
  );
}
