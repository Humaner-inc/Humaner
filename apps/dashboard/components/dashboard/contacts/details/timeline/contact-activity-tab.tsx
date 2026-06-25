import * as React from 'react';

import { ContactActivity } from '@/components/dashboard/contacts/details/timeline/contact-activity';
import { getProfile } from '@/data/account/get-profile';
import { getContactTimelineEvents } from '@/data/contacts/get-contact-timeline-events';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactActivityTabProps = {
  contact: ContactDto;
};

export async function ContactActivityTab({
  contact
}: ContactActivityTabProps): Promise<React.JSX.Element> {
  const [profile, events] = await Promise.all([
    getProfile(),
    getContactTimelineEvents({ contactId: contact.id })
  ]);

  return (
    <ContactActivity
      profile={profile}
      contact={contact}
      events={events}
    />
  );
}
