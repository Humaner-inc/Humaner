'use client';

import * as React from 'react';

import { CompanionComposer } from '@/components/dashboard/ask-humaner/companion-composer';
import { useHumanerChatOptional } from '@/components/dashboard/ask-humaner/humaner-chat-context';
import { PageAccessGate } from '@/components/dashboard/page-access-gate';
import { PlanFeatureLock } from '@/components/dashboard/plan-feature-lock';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export function DashboardWorkspaceColumn({
  profile,
  orgTier,
  children
}: {
  profile: ProfileDto;
  orgTier: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const chat = useHumanerChatOptional();
  const companionVisible = chat?.companionVisible ?? false;
  const [launcherMounted, setLauncherMounted] =
    React.useState(companionVisible);

  React.useEffect(() => {
    if (companionVisible) {
      setLauncherMounted(true);
    }
  }, [companionVisible]);

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        <PageAccessGate profile={profile}>
          <PlanFeatureLock orgTier={orgTier}>
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
          </PlanFeatureLock>
        </PageAccessGate>
      </div>
      {launcherMounted ? (
        <CompanionComposer
          departing={!companionVisible}
          onDeparted={() => setLauncherMounted(false)}
        />
      ) : null}
    </div>
  );
}
