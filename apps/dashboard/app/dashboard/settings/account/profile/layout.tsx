import * as React from 'react';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';

export type ProfileLayoutProps = {
  personalDetails: React.ReactNode;
  preferences: React.ReactNode;
  dangerZone: React.ReactNode;
};

export default function ProfileLayout({
  personalDetails,
  preferences,
  dangerZone
}: ProfileLayoutProps): React.JSX.Element {
  return (
    <AnnotatedLayout className="py-0">
      {personalDetails}
      <Separator />
      {preferences}
      <Separator />
      {dangerZone}
    </AnnotatedLayout>
  );
}
