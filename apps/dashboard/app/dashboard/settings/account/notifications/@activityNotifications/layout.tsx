import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function ActivityNotificationsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="Activity notifications"
      description="Get notified about Human Desk tickets and mail, in the app and by email."
    >
      {children}
    </AnnotatedSection>
  );
}
