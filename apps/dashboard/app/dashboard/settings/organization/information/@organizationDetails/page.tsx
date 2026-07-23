import * as React from 'react';

import { DataImprovementConsentCard } from '@/components/dashboard/settings/organization/information/data-improvement-consent-card';
import { OrganizationDetailsCard } from '@/components/dashboard/settings/organization/information/organization-details-card';
import { Separator } from '@/components/ui/separator';
import { getDataImprovementConsentSettings } from '@/data/organization/get-data-improvement-consent-settings';
import { getOrganizationDetails } from '@/data/organization/get-organization-details';

export default async function OrganizationDetailsPage(): Promise<React.JSX.Element> {
  const [details, consentSettings] = await Promise.all([
    getOrganizationDetails(),
    getDataImprovementConsentSettings()
  ]);

  return (
    <div className="space-y-0">
      <OrganizationDetailsCard details={details} />
      <Separator className="my-6" />
      <DataImprovementConsentCard
        consent={consentSettings.consent}
        consentedAt={consentSettings.consentedAt}
        modelTrainingConsent={consentSettings.modelTrainingConsent}
        modelTrainingConsentedAt={consentSettings.modelTrainingConsentedAt}
        isOwner={consentSettings.isOwner}
      />
    </div>
  );
}
