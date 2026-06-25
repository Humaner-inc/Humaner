import * as React from 'react';

import { ContactActionsDropdown } from '@/components/dashboard/contacts/details/contact-actions-dropdown';
import { ContactFavoriteToggle } from '@/components/dashboard/contacts/details/contact-favorite-toggle';
import { getContactIsInFavorites } from '@/data/contacts/get-contact-is-in-favorites';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactActionsProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
  contact: ContactDto;
};

export async function ContactActions({
  contact
}: ContactActionsProps): Promise<React.JSX.Element> {
  const addedToFavorites = await getContactIsInFavorites({
    contactId: contact.id
  });

  return (
    <div className="flex flex-row items-center gap-2">
      <ContactFavoriteToggle
        contact={contact}
        addedToFavorites={addedToFavorites}
      />
      <ContactActionsDropdown
        contact={contact}
        addedToFavorites={addedToFavorites}
      />
    </div>
  );
}
