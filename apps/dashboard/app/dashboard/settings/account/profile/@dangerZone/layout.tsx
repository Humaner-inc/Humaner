import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function DangerZoneLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Danger zone"
      description="Be careful, an account deletion cannot be undone."
    >
      {children}
    </AnnotatedSection>
  );
}
