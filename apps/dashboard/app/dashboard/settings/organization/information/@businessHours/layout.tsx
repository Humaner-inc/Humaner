import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function BusinessHoursLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Business hours"
      description="Working hours of your organization."
    >
      {children}
    </AnnotatedSection>
  );
}
