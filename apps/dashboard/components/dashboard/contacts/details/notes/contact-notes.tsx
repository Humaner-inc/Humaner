'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { FilePlus2Icon } from 'lucide-react';

import { AddContactNoteModal } from '@/components/dashboard/contacts/details/notes/add-contact-note-modal';
import { ContactNoteCard } from '@/components/dashboard/contacts/details/notes/contact-note-card';
import { Button } from '@/components/ui/button';
import { EmptyText } from '@/components/ui/empty-text';
import { ResponsiveScrollArea } from '@/components/ui/scroll-area';
import { MediaQueries } from '@/constants/media-queries';
import type { ContactDto } from '@/types/dtos/contact-dto';
import type { ContactNoteDto } from '@/types/dtos/contact-note-dto';

export type ContactNotesProps = {
  contact: ContactDto;
  notes: ContactNoteDto[];
};

export function ContactNotes({
  contact,
  notes
}: ContactNotesProps): React.JSX.Element {
  const handleShowAddContactNoteModal = async (): Promise<void> => {
    NiceModal.show(AddContactNoteModal, { contactId: contact.id });
  };
  return (
    <ResponsiveScrollArea
      breakpoint={MediaQueries.MdUp}
      mediaQueryOptions={{ ssr: true }}
      className="h-full"
    >
      <div className="flex h-16 flex-row items-center justify-between gap-2 px-6">
        <h1 className="text-sm font-semibold">
          All notes{' '}
          <span className="text-muted-foreground">({notes.length})</span>
        </h1>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={handleShowAddContactNoteModal}
        >
          <FilePlus2Icon className="mr-2 size-4 shrink-0" />
          Add note
        </Button>
      </div>
      <div className="h-full p-6 pt-0">
        {notes.length > 0 ? (
          <div className="grid size-full grid-cols-1 gap-12 sm:grid-cols-2 2xl:grid-cols-3">
            {notes.map((note) => (
              <ContactNoteCard
                key={note.id}
                note={note}
                className="h-[300px]"
              />
            ))}
          </div>
        ) : (
          <EmptyText>
            There are no associated notes with this contact.
          </EmptyText>
        )}
      </div>
    </ResponsiveScrollArea>
  );
}
