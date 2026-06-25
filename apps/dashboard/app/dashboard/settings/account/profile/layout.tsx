import * as React from 'react';
import { type Metadata } from 'next';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Profile')
};

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
