'use client';

import * as React from 'react';
import type { WorkspaceBillingAccessDto } from '@humaner/shared/billing-access';

const WorkspaceBillingAccessContext =
  React.createContext<WorkspaceBillingAccessDto>({
    readOnly: false,
    banner: null
  });

export function WorkspaceBillingAccessProvider({
  access,
  children
}: {
  access: WorkspaceBillingAccessDto;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <WorkspaceBillingAccessContext.Provider value={access}>
      {children}
    </WorkspaceBillingAccessContext.Provider>
  );
}

export function useWorkspaceBillingAccess(): WorkspaceBillingAccessDto {
  return React.useContext(WorkspaceBillingAccessContext);
}
