'use client';

import * as React from 'react';

import { addContactPageVisit } from '@/actions/contacts/add-contact-page-visit';
import { useRunOnce } from '@/hooks/use-run-once';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactPageVisitProps = {
  contact: ContactDto;
};

export function ContactPageVisit({
  contact
}: ContactPageVisitProps): React.JSX.Element {
  useRunOnce(() => addContactPageVisit({ contactId: contact.id }));
  return <></>;
}
