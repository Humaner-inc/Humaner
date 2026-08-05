import * as React from 'react';
import { WorkspaceRole } from '@prisma/client';

import { DangerZoneCard } from '@/components/dashboard/settings/account/profile/danger-zone-card';
import { getProfile } from '@/data/account/get-profile';

export default async function DangerZonePage(): Promise<React.JSX.Element> {
  const profile = await getProfile();

  return (
    <DangerZoneCard
      email={profile.email ?? ''}
      isOwner={profile.workspaceRole === WorkspaceRole.OWNER}
    />
  );
}
