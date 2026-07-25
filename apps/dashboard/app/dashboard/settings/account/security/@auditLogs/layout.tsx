import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function AuditLogsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Audit logs"
      description="Immutable record of administrative and security events for this organization. Retained for at least 2 years. Exportable for GDPR access requests."
    >
      {children}
    </AnnotatedSection>
  );
}
