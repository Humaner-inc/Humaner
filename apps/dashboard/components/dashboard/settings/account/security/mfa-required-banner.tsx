import { cookies } from 'next/headers';

import { MfaRecommendedBannerClient } from '@/components/dashboard/settings/account/security/mfa-recommended-banner-client';
import { MFA_BANNER_COOKIE } from '@/lib/auth/mfa-banner-dismiss';

export async function MfaRecommendedBanner({
  className
}: {
  className?: string;
}): Promise<React.JSX.Element | null> {
  const store = await cookies();
  if (store.get(MFA_BANNER_COOKIE)?.value === '1') {
    return null;
  }

  return <MfaRecommendedBannerClient className={className} />;
}
