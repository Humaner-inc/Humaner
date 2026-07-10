import * as React from 'react';

import { DangerZoneCard } from '@/components/dashboard/settings/account/profile/danger-zone-card';
import { getPersonalDetails } from '@/data/account/get-personal-details';

export default async function DangerZonePage(): Promise<React.JSX.Element> {
  const personalDetails = await getPersonalDetails();

  return <DangerZoneCard email={personalDetails.email ?? ''} />;
}
