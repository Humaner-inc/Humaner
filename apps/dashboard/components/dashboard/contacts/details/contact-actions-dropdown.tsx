'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { MoreHorizontalIcon } from 'lucide-react';
import { toast } from 'sonner';

import { addFavorite } from '@/actions/favorites/add-favorite';
import { removeFavorite } from '@/actions/favorites/remove-favorite';
import { DeleteContactModal } from '@/components/dashboard/contacts/delete-contact-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Routes } from '@/constants/routes';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactActionsDropdownProps = {
  contact: ContactDto;
  addedToFavorites: boolean;
};

export function ContactActionsDropdown({
  contact,
  addedToFavorites
}: ContactActionsDropdownProps): React.JSX.Element {
  const router = useRouter();
  const copyToClipboard = useCopyToClipboard();
  const handleShowDeleteContactModal = async (): Promise<void> => {
    const deleted: boolean = await NiceModal.show(DeleteContactModal, {
      contact
    });
    if (deleted) {
      router.push(Routes.Contacts);
    }
  };
  const handleCopyContactId = async (): Promise<void> => {
    await copyToClipboard(contact.id);
    toast.success('Copied!');
  };
  const handleCopyPageUrl = async (): Promise<void> => {
    await copyToClipboard(window.location.href);
    toast.success('Copied!');
  };
  const handleAddFavorite = async (): Promise<void> => {
    const result = await addFavorite({ contactId: contact.id });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't add favorite");
    }
  };
  const handleRemoveFavorite = async (): Promise<void> => {
    const result = await removeFavorite({ contactId: contact.id });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't remove favorite");
    }
  };
  return (
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyContactId}>
          Copy contact ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyPageUrl}>
          Copy page URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {addedToFavorites ? (
          <DropdownMenuItem onClick={handleRemoveFavorite}>
            Remove favorite
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleAddFavorite}>
            Add favorite
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="!text-destructive"
          onClick={handleShowDeleteContactModal}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
