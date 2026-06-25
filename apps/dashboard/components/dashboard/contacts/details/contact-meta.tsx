'use client';

import * as React from 'react';

import { ContactDetailsSection } from '@/components/dashboard/contacts/details/contact-details-section';
import { ContactStageSection } from '@/components/dashboard/contacts/details/contact-stage-section';
import { ContactTagsSection } from '@/components/dashboard/contacts/details/contact-tags-section';
import { ResponsiveScrollArea } from '@/components/ui/scroll-area';
import { MediaQueries } from '@/constants/media-queries';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactMetaProps = {
  contact: ContactDto;
};

export function ContactMeta({ contact }: ContactMetaProps): React.JSX.Element {
  return (
    <ResponsiveScrollArea
      breakpoint={MediaQueries.MdUp}
      mediaQueryOptions={{ ssr: true }}
      className="h-full"
    >
      <div className="size-full divide-y border-b md:w-[360px] md:min-w-[360px]">
        <ContactDetailsSection contact={contact} />
        <ContactStageSection contact={contact} />
        <ContactTagsSection contact={contact} />
      </div>
    </ResponsiveScrollArea>
  );
}
