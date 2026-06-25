import * as React from 'react';

import { ContactNotes } from '@/components/dashboard/contacts/details/notes/contact-notes';
import { getContactNotes } from '@/data/contacts/get-contact-notes';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactNotesTabProps = {
  contact: ContactDto;
};

export async function ContactNotesTab({
  contact
}: ContactNotesTabProps): Promise<React.JSX.Element> {
  const notes = await getContactNotes({ contactId: contact.id });
  return (
    <ContactNotes
      contact={contact}
      notes={notes}
    />
  );
}
