import { ShieldCheck } from '@humaner/shared/icons';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export function MfaRecommendedBanner(): React.JSX.Element {
  return (
    <div
      className={cn(
        'mb-6 flex items-start gap-3 border border-[#f85919]/35 bg-[#f85919]/10 px-4 py-3 font-info text-sm text-foreground',
        dashboardRadiusClassName
      )}
      role="status"
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#f85919]" />
      <div>
        <p>Two-factor authentication is highly recommended</p>
        <p className="mt-0.5 text-muted-foreground">
          Workspace owners and platform admins should enable an authenticator
          app to protect account access.
        </p>
      </div>
    </div>
  );
}
