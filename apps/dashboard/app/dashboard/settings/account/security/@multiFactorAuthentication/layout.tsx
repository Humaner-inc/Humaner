import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function MultiFactorAuthenticationLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Multi-factor authentication"
      description="Add an extra layer of security to your login by requiring an additional factor."
    >
      {children}
    </AnnotatedSection>
  );
}
