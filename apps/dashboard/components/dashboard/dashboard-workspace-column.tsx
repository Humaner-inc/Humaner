'use client';

import * as React from 'react';

import { CompanionComposer } from '@/components/dashboard/ask-humaner/companion-composer';
import { useHumanerChatOptional } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { PageAccessGate } from '@/components/dashboard/page-access-gate';
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
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <PageAccessGate profile={profile}>
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </PageAccessGate>
      {companionVisible ? <CompanionComposer /> : null}
    </div>
  );
}
