import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function PersonalDetailsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Personal details"
      description="Set your name and contact information, the email address entered here is used for your login access."
    >
      {children}
    </AnnotatedSection>
  );
}
