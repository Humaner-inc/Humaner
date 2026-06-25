import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function OrganizationDetailsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Organization details"
      description="Basic details about your organization."
    >
      {children}
    </AnnotatedSection>
  );
}
