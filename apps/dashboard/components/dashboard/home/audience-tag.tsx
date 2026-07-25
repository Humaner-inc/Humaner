import * as React from 'react';
import { BriefcaseBusinessIcon, UsersIcon } from '@humaner/shared/icons';
import type { TargetAudience } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type AudienceTagProps = {
  targetAudience: TargetAudience | null;
};

const AUDIENCE_META: Record<
  TargetAudience,
  { label: string; Icon: typeof UsersIcon; labelClassName: string }
> = {
  B2C: { label: 'B2C', Icon: UsersIcon, labelClassName: 'font-display' },
  B2B: {
    label: 'B2B',
    Icon: BriefcaseBusinessIcon,
    labelClassName: 'font-fellix'
  }
};

export function AudienceTag({
  targetAudience
}: AudienceTagProps): React.JSX.Element {
  const meta = targetAudience ? AUDIENCE_META[targetAudience] : null;
  const Icon = meta?.Icon;

  return (
    <Badge
      variant="secondary"
      className="gap-1.5 px-2.5 py-1"
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {meta ? (
        <span
          className={cn(
            'text-sm font-semibold tracking-tight',
            meta.labelClassName
          )}
        >
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
