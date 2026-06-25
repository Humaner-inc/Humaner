import * as React from 'react';

import { ChangePasswordCard } from '@/components/dashboard/settings/account/security/change-password-card';
import { getHasPasswordSet } from '@/data/account/get-has-password-set';

export default async function ChangePasswordPage(): Promise<React.JSX.Element> {
  const hasPasswordSet = await getHasPasswordSet();
  return <ChangePasswordCard hasPasswordSet={hasPasswordSet} />;
}
