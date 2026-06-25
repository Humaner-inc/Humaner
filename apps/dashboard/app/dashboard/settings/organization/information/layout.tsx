import * as React from 'react';
import { type Metadata } from 'next';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Organization information')
};

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
    </AnnotatedLayout>
  );
}
