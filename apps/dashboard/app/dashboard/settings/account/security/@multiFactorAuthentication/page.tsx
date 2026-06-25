import * as React from 'react';

import { MultiFactorAuthenticationCard } from '@/components/dashboard/settings/account/security/multi-factor-authentication-card';
import { getMultiFactorAuthentication } from '@/data/account/get-multi-factor-authentication';

export default async function MultiFactorAuthenticationPage(): Promise<React.JSX.Element> {
  const multiFactorAuthentication = await getMultiFactorAuthentication();
  return <MultiFactorAuthenticationCard {...multiFactorAuthentication} />;
}
