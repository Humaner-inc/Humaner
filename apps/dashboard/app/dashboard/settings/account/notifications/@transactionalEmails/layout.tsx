import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function TransactionalEmailsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Transactional emails"
      description="Receive emails about team and account activities."
    >
      {children}
    </AnnotatedSection>
  );
}
