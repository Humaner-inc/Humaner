import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';
import { dangerZoneTitleClassName } from '@/components/ui/danger-zone';

export default function DangerZoneLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Danger zone"
      titleClassName={dangerZoneTitleClassName}
      description="Be careful, an account deletion cannot be undone."
    >
      {children}
    </AnnotatedSection>
  );
}
