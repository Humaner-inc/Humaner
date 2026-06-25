'use client';

import * as React from 'react';
import { StarIcon } from 'lucide-react';
import { toast } from 'sonner';

import { addFavorite } from '@/actions/favorites/add-favorite';
import { removeFavorite } from '@/actions/favorites/remove-favorite';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactFavoriteToggleProps = ButtonProps & {
  contact: ContactDto;
  addedToFavorites: boolean;
};

export function ContactFavoriteToggle({
  contact,
  addedToFavorites,
  className,
  ...other
}: ContactFavoriteToggleProps): React.JSX.Element {
  const description = addedToFavorites ? 'Remove favorite' : 'Add favorite';
  const handleToggleFavorite = async (): Promise<void> => {
    if (addedToFavorites) {
      const result = await removeFavorite({ contactId: contact.id });
      if (result?.serverError || result?.validationErrors) {
        toast.error("Couldn't remove favorite");
      }
    } else {
      const result = await addFavorite({ contactId: contact.id });
      if (result?.serverError || result?.validationErrors) {
        toast.error("Couldn't add favorite");
      }
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      title={description}
      onClick={handleToggleFavorite}
      className={cn('size-9', className)}
      {...other}
    >
      <StarIcon
        className={cn('size-4 shrink-0', addedToFavorites && 'fill-primary')}
      />
      <span className="sr-only">{description}</span>
    </Button>
  );
}
