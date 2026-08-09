import { ShieldCheck } from '@humaner/shared/icons';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';

export function MfaRecommendedBanner(): React.JSX.Element {
  const oss = isOssDeployment();

  return (
    <div
      className={cn(
        'mb-6 flex items-start gap-3 px-4 py-3 text-sm text-foreground',
        oss
          ? cn(
              dashboardRadiusClassName,
              'border border-orange-400/40 bg-orange-500/10'
            )
          : 'border border-[#e1ccaf]/40 bg-[#e1ccaf]/10'
      )}
    >
      <ShieldCheck
        className={cn(
          'mt-0.5 size-4 shrink-0',
          oss ? 'text-orange-600 dark:text-orange-300' : 'text-[#0A0D0D]'
        )}
      />
      <div>
        <p className="font-medium">
          Two-factor authentication is highly recommended
        </p>
        <p className="mt-0.5 text-muted-foreground">
          Workspace owners and platform admins should enable an authenticator
          app to protect account access. This is optional, but strongly
          encouraged.
        </p>
      </div>
    </div>
  );
}
