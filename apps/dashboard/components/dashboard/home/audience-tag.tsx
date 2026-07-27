import * as React from 'react';
import { BriefcaseBusinessIcon, UsersIcon } from '@humaner/shared/icons';
import type { TargetAudience } from '@prisma/client';

import { Badge } from '@/components/ui/badge';

export type AudienceTagProps = {
  targetAudience: TargetAudience | null;
};

const AUDIENCE_META: Record<
  TargetAudience,
  { label: string; Icon: typeof UsersIcon }
> = {
  B2C: { label: 'B2C', Icon: UsersIcon },
  B2B: { label: 'B2B', Icon: BriefcaseBusinessIcon }
};

export function AudienceTag({
  targetAudience
}: AudienceTagProps): React.JSX.Element {
  const meta = targetAudience ? AUDIENCE_META[targetAudience] : null;
  const Icon = meta?.Icon;

  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-none px-2.5 py-1"
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {meta ? (
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em]">
          {meta.label}
        </span>
      ) : (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
          No audience set
        </span>
      )}
    </Badge>
  );
}
