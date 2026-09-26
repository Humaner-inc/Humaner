import 'server-only';

import { cache } from 'react';
import type { WorkspaceBillingAccessDto } from '@humaner/shared/billing-access';

const DEFAULT_ACCESS: WorkspaceBillingAccessDto = {
  readOnly: false,
  banner: null
};

export const getWorkspaceBillingAccess = cache(
  async (): Promise<WorkspaceBillingAccessDto> => DEFAULT_ACCESS
);
