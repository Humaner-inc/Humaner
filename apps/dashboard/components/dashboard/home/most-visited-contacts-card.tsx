import * as React from 'react';

import { VisitedContactList } from '@/components/dashboard/home/visited-contact-list';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type CardProps
} from '@/components/ui/card';
import { EmptyText } from '@/components/ui/empty-text';
import type { VisitedContactDto } from '@/types/dtos/visited-contact-dto';

export type MostVisitedContactsCardProps = CardProps & {
  contacts: VisitedContactDto[];
};

export function MostVisitedContactsCard({
  contacts,
  ...props
}: MostVisitedContactsCardProps): React.JSX.Element {
  const hasContacts = contacts.length > 0;
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="text-base">Most visited contacts</CardTitle>
      </CardHeader>
      <CardContent>
        {hasContacts ? (
          <VisitedContactList contacts={contacts} />
        ) : (
          <EmptyText>There's no data available for your selection.</EmptyText>
        )}
      </CardContent>
    </Card>
  );
}
