import * as React from 'react';

import { OrganizationDangerZoneSection } from '@/components/dashboard/settings/organization/information/organization-danger-zone-section';
import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';

export type OrganizationInformationLayoutProps = {
  organizationDetails: React.ReactNode;
  businessHours: React.ReactNode;
  socialMedia: React.ReactNode;
};

export default function OrganizationInformationLayout({
  organizationDetails,
  businessHours,
  socialMedia
}: OrganizationInformationLayoutProps): React.JSX.Element {
  return (
    <AnnotatedLayout className="py-0">
      {organizationDetails}
      <Separator />
      {businessHours}
      <Separator />
      {socialMedia}
      <Separator />
      <OrganizationDangerZoneSection />
    </AnnotatedLayout>
  );
}
