import * as React from 'react';

import { SessionList } from '@/components/dashboard/settings/account/security/session-list';
import { Card, CardContent, type CardProps } from '@/components/ui/card';
import { EmptyText } from '@/components/ui/empty-text';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SessionDto } from '@/types/dtos/session-dto';

export type SessionsCardProps = CardProps & {
  sessions: SessionDto[];
};

export function SessionsCard({
  sessions,
  className,
  ...other
}: SessionsCardProps): React.JSX.Element {
  return (
    <Card
      className={cn('flex h-full flex-col', className)}
      {...other}
    >
      <CardContent className="max-h-72 flex-1 overflow-hidden p-0">
        {sessions.length > 0 ? (
          <ScrollArea className="h-full">
            <SessionList sessions={sessions} />
          </ScrollArea>
        ) : (
          <EmptyText className="p-6">No session found.</EmptyText>
        )}
      </CardContent>
    </Card>
  );
}
