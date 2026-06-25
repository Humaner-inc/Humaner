'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { format } from 'date-fns';
import { ClockIcon, MoreHorizontalIcon } from 'lucide-react';

import { DeleteContactNoteModal } from '@/components/dashboard/contacts/details/notes/delete-contact-note-modal';
import { EditContactNoteModal } from '@/components/dashboard/contacts/details/notes/edit-contact-note-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  type CardProps
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EmptyText } from '@/components/ui/empty-text';
import { Separator } from '@/components/ui/separator';
import { convertMarkdownToHtml } from '@/lib/markdown/convert-markdown-to-html';
import { getInitials } from '@/lib/utils';
import type { ContactNoteDto } from '@/types/dtos/contact-note-dto';

type ContactNoteCardProps = CardProps & {
  note: ContactNoteDto;
};

export function ContactNoteCard({
  note,
  ...others
}: ContactNoteCardProps): React.JSX.Element {
  const handleShowEditContactNoteModal = (): void => {
    NiceModal.show(EditContactNoteModal, { note });
  };
  const handleShowDeleteContactNoteModal = (): void => {
    NiceModal.show(DeleteContactNoteModal, { note });
  };
  return (
    <Card {...others}>
      <CardHeader className="flex flex-row justify-between space-y-0 py-3">
        <div className="flex flex-row items-center gap-2">
          <Avatar className="relative size-6 flex-none rounded-full">
            <AvatarImage
              src={note.sender.image}
              alt="avatar"
            />
            <AvatarFallback className="size-6 text-[10px]">
              {getInitials(note.sender.name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm">{note.sender.name}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="size-9"
              title="Open menu"
            >
              <MoreHorizontalIcon className="size-4 shrink-0" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleShowEditContactNoteModal}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="!text-destructive"
              onClick={handleShowDeleteContactNoteModal}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <Separator />
      <Button
        type="button"
        className="h-[calc(100%-60px-48px)] w-full items-start justify-start overflow-y-auto overflow-x-hidden !bg-transparent p-6 text-left text-sm font-normal"
        variant="ghost"
        onClick={handleShowEditContactNoteModal}
      >
        {note.text ? (
          <div className="text-wrap break-all [&_h1]:mb-5 [&_h1]:text-[25px] [&_h1]:font-bold [&_h2]:mb-5 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mx-8 [&_li]:my-0 [&_ol]:mb-3 [&_p:last-child]:mb-0 [&_p]:relative [&_p]:m-0 [&_ul]:mb-3">
            <div
              dangerouslySetInnerHTML={{
                __html: convertMarkdownToHtml(note.text)
              }}
            />
          </div>
        ) : (
          <EmptyText className="opacity-65">Empty</EmptyText>
        )}
      </Button>
      <Separator />
      <CardFooter className="flex h-12 flex-row items-center justify-between py-0">
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <ClockIcon className="size-3 shrink-0" />
          <time>{format(note.createdAt, 'MMM dd, yyyy')}</time>
        </div>
      </CardFooter>
    </Card>
  );
}
