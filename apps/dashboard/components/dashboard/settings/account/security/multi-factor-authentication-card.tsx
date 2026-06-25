import * as React from 'react';

import { MultiFactorAuthenticationList } from '@/components/dashboard/settings/account/security/multi-factor-authentication-list';
import { Card, CardContent, type CardProps } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { MultiFactorAuthenticationDto } from '@/types/dtos/multi-factor-authentication-dto';

export type MultiFactorAuthenticationCardProps = CardProps &
  MultiFactorAuthenticationDto;

export function MultiFactorAuthenticationCard({
  authenticatorApp,
  className,
  ...other
}: MultiFactorAuthenticationCardProps): React.JSX.Element {
  return (
    <Card
      className={cn('flex h-full flex-col', className)}
      {...other}
    >
      <CardContent className="max-h-72 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full [&>[data-radix-scroll-area-viewport]>div]:!block">
          <MultiFactorAuthenticationList authenticatorApp={authenticatorApp} />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
