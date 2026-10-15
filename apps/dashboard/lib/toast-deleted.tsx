import * as React from 'react';
import { toast } from 'sonner';

import { SquircleStatusIcon } from '@/components/ui/squircle-status-icon';

type DeletedToastData = NonNullable<Parameters<typeof toast>[1]>;

/** Success toast for deletions/removals, shown with the squircle cross icon. */
export function toastDeleted(
  message: React.ReactNode,
  data?: DeletedToastData
): string | number {
  return toast.success(message, {
    ...data,
    icon: (
      <SquircleStatusIcon
        kind="cancelled"
        className="size-4"
      />
    )
  });
}
