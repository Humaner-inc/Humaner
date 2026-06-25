import * as React from 'react';
import { InfoIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export function PasswordLoginHint({
  className,
  ...other
}: React.HtmlHTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('max-w-4xl px-6', className)}
      {...other}
    >
      <Alert variant="default">
        <div className="flex flex-row items-start gap-2">
          <InfoIcon className="mt-0.5 size-[18px] shrink-0" />
          <AlertDescription>
            Regardless of connected accounts, you will always have a password
            login as well.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
