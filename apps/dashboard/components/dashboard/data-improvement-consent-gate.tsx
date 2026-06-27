'use client';

import * as React from 'react';

import { DataImprovementConsentDialog } from '@/components/dashboard/data-improvement-consent-dialog';

export type DataImprovementConsentGateProps = {
  privacyPolicyUrl: string;
  showPrompt: boolean;
};

export function DataImprovementConsentGate({
  privacyPolicyUrl,
  showPrompt: initialShowPrompt
}: DataImprovementConsentGateProps): React.JSX.Element | null {
  const [showPrompt, setShowPrompt] = React.useState(initialShowPrompt);

  if (!showPrompt) {
    return null;
  }

  return (
    <DataImprovementConsentDialog
      privacyPolicyUrl={privacyPolicyUrl}
      open={showPrompt}
      onResolved={() => setShowPrompt(false)}
    />
  );
}
