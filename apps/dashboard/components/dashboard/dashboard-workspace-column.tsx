'use client';

import * as React from 'react';

import { CompanionComposer } from '@/components/dashboard/ask-humaner/companion-composer';
import { useHumanerChatOptional } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { PageAccessGate } from '@/components/dashboard/page-access-gate';
import {
  COMPANION_DOCK_OFFSET,
  COMPANION_DOCK_OFFSET_VAR,
  COMPANION_WORKSPACE_OFFSET_CLASS
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

  return (
    <div
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden"
      style={
        {
          [COMPANION_DOCK_OFFSET_VAR]: companionVisible
            ? COMPANION_DOCK_OFFSET
            : '0px'
        } as React.CSSProperties
      }
    >
      <PageAccessGate profile={profile}>
        <div
          className={cn(
            'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
            companionVisible && COMPANION_WORKSPACE_OFFSET_CLASS
          )}
        >
          {children}
        </div>
      </PageAccessGate>
      {companionVisible ? <CompanionComposer /> : null}
    </div>
  );
}
